import { Inngest } from "inngest";
import { connectDb } from "../db/init.js";
import { and, eq, ne } from "drizzle-orm";
import { seats, shows, showSeats, tickets, users } from "../db/schema.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });

const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

const showSeat = inngest.createFunction(
  { id: "seat_create" },
  { event: "show/show-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const { showId, screenId } = event.data;

      // seats table should have `row` and `column` = total seats in that row
      const seatRows = await db
        .select({ row: seats.row, totalSeats: seats.column }) // column = total seats in that row
        .from(seats)
        .where(eq(seats.screenId, Number(screenId)));

      if (!seatRows.length) {
        return {
          success: false,
          error: "No seat layout found for this screen",
        };
      }

      const showSeatsRows: any[] = [];

      seatRows.forEach((seatRow: any) => {
        const rowName = seatRow.row;
        const total = seatRow.totalSeats;

        for (let col = 1; col <= total; col++) {
          showSeatsRows.push({
            showId: Number(showId),
            screenId: Number(screenId),
            row: rowName,
            column: col,
            isBooked: false,
          });
        }
      });

      await db.insert(showSeats).values(showSeatsRows);

      return { success: true, created: showSeatsRows.length };
    } catch (err: any) {
      console.error("Failed to create show seats:", err);
      return { success: false, error: err.message };
    }
  },
);

const inActiveSeats = inngest.createFunction(
  { id: "inactive-seats" },
  { event: "booking/inactive-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const { id, userId } = event.data;

      const result = await db
        .update(showSeats)
        .set({
          status: "SELECTED",
          booked_by: userId,
        })
        .where(and(eq(showSeats.id, id), ne(showSeats.status, "BOOKED")))
        .execute();

      return { success: true, updated: result.rowCount };
    } catch (err: any) {
      console.error("Failed to mark seats as inactive:", err);
      return { success: false, error: err.message };
    }
  },
);

const bookSeats = inngest.createFunction(
  { id: "book-seats" },
  { event: "booking/book-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const now = new Date();
      const time = now.toLocaleTimeString();
      const { id, userId, transaction_id, phone, pidx } = event.data;
      const result = await db
        .update(showSeats)
        .set({
          status: "BOOKED",
          booked_by: userId,
          bookedTime: time as string,

        })
        .where(
          and(
            eq(showSeats.showId, id),
            eq(showSeats.booked_by, userId),
            eq(showSeats.status, "SELECTED"),
          ),
        )
        .execute();

      const data = await db
        .insert(tickets)
        .values({
          paymentMethod: "KHALTI",
          paymentDate: new Date(),
          customerId: userId,
          showId: Number(id),
          transactionId: transaction_id,
          mobile: phone,
          pidx,
          bookedTime: time as string,
        })
        .returning();

      const ticket_id = await data[0].id;
      const bookedTime = await data[0].bookedTime;

      await db
        .update(showSeats)
        .set({
          ticketId: ticket_id,
        })
        .where(
          and(
            eq(showSeats.showId, id),
            eq(showSeats.booked_by, userId),
            eq(showSeats.status, "BOOKED"),
            eq(showSeats.bookedTime, bookedTime),
          ),
        )
        .execute();

      return { success: true, updated: result.rowCount };
    } catch (err: any) {
      console.error("Failed to mark seats as inactive:", err);
      return { success: false, error: err.message };
    }
  },
);

const clearSelectedSeats = inngest.createFunction(
  { id: "clear-seats" },
  { event: "booking/clear-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const { id, userId } = event.data;

      const result = await db
        .update(showSeats)
        .set({
          status: "AVAILABLE",
          booked_by: null,
        })
        .where(
          and(
            eq(showSeats.showId, Number(id)),
            eq(showSeats.booked_by, userId),
            ne(showSeats.status, "BOOKED"),
          ),
        )
        .execute();

      return { success: true, updated: result.rowCount };
    } catch (err: any) {
      console.error("Failed to mark seats as inactive:", err);
      return { success: false, error: err.message };
    }
  },
);

const syncUser = inngest.createFunction(
  { id: 'sync-user-from-clerk' }, // ←The 'id' is an arbitrary string used to identify the function in the dashboard
  { event: 'clerk/user.created' }, // ← This is the function's triggering event
  async ({ event }) => {
    const db = connectDb();
    const user = event.data // The event payload's data will be the Clerk User json object
    const { id, first_name, last_name } = user
    const email = user.email_addresses.find(
      (e:any) => e.id === user.primary_email_address_id,
    ).email_address
    await db.insert(users).values({
      clerkId: id,
      name: `${first_name} ${last_name}`,
      email: email,
      points: 0,
      role: 'USER',
    }).returning();
  },
)

const syncDeleteUser = inngest.createFunction(
  { id: 'delete-user-from-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {  
    const db = connectDb();
    const user = event.data
    const { id } = user
    await db.delete(users).where(eq(users.clerkId, id)).returning();
  }
);
// Create an empty array where we'll export future Inngest functions
export const functions = [
  helloWorld,
  showSeat,
  inActiveSeats,
  clearSelectedSeats,
  bookSeats,
  syncUser,
  syncDeleteUser
];
