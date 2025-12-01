import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { screens, seats, shows, showSeats } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import type { NewSeat, Screens, Seat } from "../types.js";
import { inngest } from "../inngest/index.js";

const seatRoutes = new Hono();

seatRoutes.get("/", async (c) => {
  try {
    const db = connectDb();
    const seatsList = await db.select().from(seats);
    return c.json({ message: "List of seats", data: seatsList });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching seats", error: error.message },
      500,
    );
  }
});

seatRoutes.get("/screen/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const db = connectDb();
    const data = await db
      .select()
      .from(shows)
      .where(eq(shows.id, Number(id)));
    const seat = await db
      .select()
      .from(seats)
      .where(eq(seats.screenId, Number(data[0].screenId)));
    if (seat.length === 0) {
      return c.json({ message: `Seat with Screen ID ${id} not found` }, 404);
    }
    return c.json({
      message: `Details of seat with Screen ID ${id}`,
      data: seat,
    });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching seat", error: error.message },
      500,
    );
  }
});

seatRoutes.put("/inactive", async (c) => {
  try {
    const { showId, row, column, userId } = await c.req.json();
    console.log(showId, row, column, userId);
    if (!showId || !row || !column || !userId) {
      return c.json({ message: "Missing required fields" }, 400);
    }
    const db = connectDb();

    const seat = await db
      .select()
      .from(showSeats)
      .where(
        and(
          eq(showSeats.showId, showId),
          eq(showSeats.row, row),
          eq(showSeats.column, column),
        ),
      );

    if (!seat[0]) {
      return c.json({ message: "Seat not found" }, 404);
    }

    const seatId = seat[0].id;

    // Send event to Inngest
    await inngest.send({
      name: "booking/inactive-seats",
      data: { id: seatId, userId },
    });

    return c.json({ message: "Seat set to SELECTED", seatId }, 200);
  } catch (error: any) {
    return c.json(
      { message: "Error marking seat inactive", error: error.message },
      500,
    );
  }
});

seatRoutes.put("/clear/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const { userId } = await c.req.json();
    if (!id || !userId) return c.json({ message: "Missing Value" });

    await inngest.send({
      name: "booking/clear-seats",
      data: { id, userId },
    });
    return c.json({ message: " Reseted Seats" }, 200);
  } catch (e: any) {
    c.json({ message: "Error marking seat inactive", error: e.message }, 500);
  }
});

seatRoutes.put("/booked", async (c) => {
  try {
    const { id, userId, transaction_id, mobile, phone, pidx, showId } =
      await c.req.json();
    if (!id || !userId || !transaction_id || !mobile || !pidx)
      return c.json({ message: "Missing Value" });

    await inngest.send({
      name: "booking/book-seats",
      data: {
        id,
        userId,
        transaction_id,
        mobile,
        pidx,
        showId,
        phone,
      },
    });

    return c.json({ message: " Seats booked" }, 200);
  } catch (e: any) {
    c.json({ message: "Error marking seat inactive", error: e.message }, 500);
  }
});


seatRoutes.put("/reserved", async (c) => {
  try {
    const { id, userId} =
      await c.req.json();
    if (!id || !userId )
      return c.json({ message: "Missing Value" });

    await inngest.send({
      name: "booking/reserve-seats",
      data: {
        id,
        userId
      },
    });

    return c.json({ message: " Seats booked" }, 200);
  } catch (e: any) {
    c.json({ message: "Error marking seat inactive", error: e.message }, 500);
  }
});

// ? create a new seat according to screenId
seatRoutes.post("/:id", async (c) => {
  try {
    const data: { row: string; column: number }[] = await c.req.json(); // array from frontend
    const screenId = Number(c.req.param("id"));

    const db = connectDb();

    // Check if the screen exists
    const screenExists = await db
      .select()
      .from(screens)
      .where(eq(screens.id, screenId))
      .limit(1);

    if (!screenExists.length) {
      return c.json(
        { message: `Screen with ID ${screenId} does not exist` },
        400,
      );
    }

    // Add screenId to each seat
    const seatsToInsert = data.map((seat) => ({
      ...seat,
      screenId,
    }));

    // Insert all seats at once
    const newSeats = await db.insert(seats).values(seatsToInsert).returning();

    return c.json({ message: "Seats created successfully", data: newSeats });
  } catch (error: any) {
    return c.json(
      { message: "Error creating seats", error: error.message },
      500,
    );
  }
});

seatRoutes.get("/all/:id", async (c) => {
  const { id } = c.req.param();

  try {
    const db = connectDb();

    // Fetch all seats for this screen ID
    const seatList = await db
      .select()
      .from(seats)
      .where(eq(seats.screenId, Number(id)))
      .execute();

    return c.json({ message: `Seats for Screen ID ${id}`, data: seatList });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching seats", error: error.message },
      500,
    );
  }
});

seatRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const db = connectDb();
    const seat = await db
      .select()
      .from(showSeats)
      .where(eq(showSeats.showId, Number(id)));
    if (seat.length === 0) {
      return c.json({ message: `Seat with ID ${id} not found` }, 404);
    }
    const groupedSeats: Record<string, number[]> = {};
    seat.forEach((s: any) => {
      if (!groupedSeats[s.row]) {
        groupedSeats[s.row] = [];
      }
      groupedSeats[s.row].push(s.column);
    });
    return c.json({ message: `Details of seat with ID ${id}`, data: seat });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching seat", error: error.message },
      500,
    );
  }
});
// update seat
seatRoutes.put("/:id", async (c) => {
  const { id } = c.req.param();
  const data = await c.req.json();

  try {
    const db = connectDb();
    await db
      .update(seats)
      .set(data)
      .where(eq(seats.id, Number(id)))
      .returning();
    return c.json({ message: `Update seat with ID ${id}`, data });
  } catch (error: any) {
    return c.json(
      { message: "Error updating seat", error: error.message },
      500,
    );
  }
});

// update seat status
seatRoutes.patch("/:id/status", async (c) => {
  const { id } = c.req.param();
  const { isBooked } = await c.req.json();

  try {
    const db = connectDb();
    await db
      .update(seats)
      .set({ isBooked })
      .where(eq(seats.id, Number(id)))
      .returning();
    return c.json({
      message: `Update booking status of seat with ID ${id}`,
      data: { isBooked },
    });
  } catch (error: any) {
    return c.json(
      { message: "Error updating seat booking status", error: error.message },
      500,
    );
  }
});

// delete seat
seatRoutes.delete("/:id", async (c) => {
  const { id } = c.req.param();

  try {
    const db = connectDb();
    await db
      .delete(seats)
      .where(eq(seats.id, Number(id)))
      .returning();
    return c.json({ message: `Delete seat with ID ${id}` });
  } catch (error: any) {
    return c.json(
      { message: "Error deleting seat", error: error.message },
      500,
    );
  }
});

// inserting all at once seats
seatRoutes.post("/bulk", async (c) => {
  const data = await c.req.json();

  try {
    const db = connectDb();

    for (const seatData of data) {
      const screenExists = await db
        .select()
        .from(screens)
        .where(eq(screens.id, seatData.screenId))
        .limit(1);
      if (!screenExists) {
        return c.json(
          { message: `Screen with ID ${seatData.screenId} does not exist` },
          400,
        );
      }
    }

    const newSeats = await db.insert(seats).values(data).returning();
    return c.json({ message: "Create new seats", data: newSeats });
  } catch (error: any) {
    return c.json(
      { message: "Error creating seats", error: error.message },
      500,
    );
  }
});
export default seatRoutes;
