import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { screens, seats } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { NewSeat, Screens, Seat } from "../types.js";

const seatRoutes = new Hono();


seatRoutes.get('/', async (c) => {
  try {
    const db = connectDb();
    const seatsList = await db.select().from(seats);
    return c.json({ message: 'List of seats', data: seatsList });
  } catch (error: any) {
    return c.json({ message: 'Error fetching seats', error: error.message }, 500);
  }
});

// ? create a new seat
seatRoutes.post("/", async (c) => {
  const data: NewSeat = await c.req.json();

  try {
    const db = connectDb();
    const screenExists: Screens = await db.select().from(screens).where(eq(screens.id, data.screenId)).limit(1);
    if (!screenExists) {
      return c.json({ message: `Screen with ID ${data.screenId} does not exist` }, 400);
    }

    const newSeat: NewSeat = await db.insert(seats).values(data).returning();
    return c.json({ message: 'Create a new seat', data: newSeat });

  } catch (error: any) {
    return c.json({ message: 'Error creating seat', error: error.message }, 500);
  }
})


//read by id
seatRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const db = connectDb();
    const seat: Seat = await db.select().from(seats).where(eq(seats.id, Number(id)));
    if (!seat) {
      return c.json({ message: `Seat with ID ${id} not found` }, 404);
    }
    return c.json({ message: `Details of seat with ID ${id}`, data: seat });
  }
  catch (error: any) {
    return c.json({ message: 'Error fetching seat', error: error.message }, 500);
  }
});

// update seat
seatRoutes.put('/:id', async (c) => {
  const { id } = c.req.param();
  const data = await c.req.json();

  try {
    const db = connectDb();
    await db.update(seats).set(data).where(eq(seats.id, Number(id))).returning();
    return c.json({ message: `Update seat with ID ${id}`, data });
  } catch (error: any) {
    return c.json({ message: 'Error updating seat', error: error.message }, 500);
  }
});

// update seat status
seatRoutes.patch('/:id/status', async (c) => {
  const { id } = c.req.param();
  const { isBooked } = await c.req.json();

  try {
    const db = connectDb();
    await db.update(seats).set({ isBooked }).where(eq(seats.id, Number(id))).returning();
    return c.json({ message: `Update booking status of seat with ID ${id}`, data: { isBooked } });
  } catch (error: any) {
    return c.json({ message: 'Error updating seat booking status', error: error.message }, 500);
  }
});


// delete seat
seatRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const db = connectDb();
    await db.delete(seats).where(eq(seats.id, Number(id))).returning();
    return c.json({ message: `Delete seat with ID ${id}` });
  } catch (error: any) {
    return c.json({ message: 'Error deleting seat', error: error.message }, 500);
  }
});


// inserting all at once seats
seatRoutes.post('/bulk', async (c) => {
  const data = await c.req.json();

  try {
    const db = connectDb();

    for (const seatData of data) {
      const screenExists = await db.select().from(screens).where(eq(screens.id, seatData.screenId)).limit(1);
      if (!screenExists) {
        return c.json({ message: `Screen with ID ${seatData.screenId} does not exist` }, 400);
      }
    }

    const newSeats = await db.insert(seats).values(data).returning();
    return c.json({ message: 'Create new seats', data: newSeats });
  } catch (error: any) {
    return c.json({ message: 'Error creating seats', error: error.message }, 500);
  }
});
export default seatRoutes;

