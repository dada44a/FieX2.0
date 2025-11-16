import { Inngest } from "inngest";
import { connectDb } from "../db/init.js";
import { eq } from "drizzle-orm";
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
            const exists = await db.select({ id: shows.id })
                .from(shows)
                .where(eq(shows.id, showId));

            console.log("Show exists check:", exists);
            // Fetch seat IDs as plain objects
            const seatList = await db
                .select({ seatId: seats.id, seatScreenId: seats.screenId }) // ✅ alias fixes stack overflow
                .from(seats)
                .where(eq(seats.screenId, screenId));

            console.log("Seats fetched:", seatList);

            const rows = seatList.map((seat: any) => ({
                showId: Number(showId),
                seatId: Number(seat.seatId),
                screenId: Number(seat.seatScreenId),
                isBooked: false,
            }));

            console.log("Rows to insert:", rows);

            if (rows.length > 0) {
                await db.insert(showSeats).values(rows);
            } else {
                console.log("No seats found for screen", screenId);
            }

            return { success: true, created: rows.length };
        } catch (err: any) {
            console.error("Failed to create show seats:", err);
            return { success: false, error: err.message };
        }
    }
);


// Create an empty array where we'll export future Inngest functions
export const functions = [helloWorld, showSeat];