import { Inngest } from "inngest";
import { connectDb } from "../db/init.js";
import { and, eq } from "drizzle-orm";
import { seats, shows, showSeats } from "../db/schema.js";

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

      // Fetch seat layout for the screen
      // seats table should have `row` and `column` = total seats in that row
      const seatRows = await db
        .select({ row: seats.row, totalSeats: seats.column }) // column = total seats in that row
        .from(seats)
        .where(eq(seats.screenId, screenId));

      if (!seatRows.length) {
        return {
          success: false,
          error: "No seat layout found for this screen",
        };
      }

      const showSeatsRows: any[] = [];

      // For each row, generate seats
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

      // Insert all rows at once
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
        .where(eq(showSeats.id, id))
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

// Create an empty array where we'll export future Inngest functions
export const functions = [
  helloWorld,
  showSeat,
  inActiveSeats,
  clearSelectedSeats,
];
