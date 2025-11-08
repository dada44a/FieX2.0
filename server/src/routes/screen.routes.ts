import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { screens, seats } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type {  NewScreens, Screens, Seat } from "../types.js";

const screenRoutes = new Hono();

screenRoutes.get('/', async(c) => {
  try {
    const db = connectDb();
    const screensList: Screens[] = await db.select().from(screens);
    return c.json({ message: 'List of screens', data: screensList });
  } catch (error: any) {
    return c.json({ message: 'Error fetching screens', error: error.message }, 500);
  }
});

screenRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const db = connectDb();
    const screen: Screens = await db.select().from(screens).where(eq(screens.id, Number(id)));
    if (!screen) {
      return c.json({ message: `Screen with ID ${id} not found` }, 404);
    }
    return c.json({ message: `Details of screen with ID ${id}`, data: screen });
  } catch (error: any) {
    return c.json({ message: 'Error fetching screen', error: error.message }, 500);
  }
});

// insert a new screen
screenRoutes.post('/', async (c) => {
  try {
    const db = connectDb();
    const data = await c.req.json();
    const newScreening = await db.insert(screens).values(data).returning();
    return c.json({ message: 'Create a new screen', data: newScreening });
  } catch (error: any) {
    return c.json({ message: 'Error creating screen', error: error.message }, 500);
  }
});

screenRoutes.put('/:id', async (c) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  try{
    const db = connectDb();
    await db.update(screens).set(data).where(eq(screens.id, Number(id))).returning();
    return c.json({ message: `Update screen with ID ${id}`, data });
  } catch (error: any) {
    console.error('Error updating screen:', error.message);
    return c.json({ message: 'Error updating screen', error: error.message }, 500);
  }
});


screenRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  try{
    const db = connectDb();
    await db.delete(screens).where(eq(screens.id, Number(id))).returning();
    return c.json({ message: `Delete screen with ID ${id}` });
  } catch (error: any) {
    console.error('Error deleting screen:', error.message);
    return c.json({ message: 'Error deleting screen', error: error.message }, 500);
  }
});

// get seats by screen ID
screenRoutes.get("/:id/seats", async (c)=>{
  const {id} = c.req.param();
  try{
    const db = connectDb();

    const screenExists = await db.select().from(screens).where(eq(screens.id, Number(id))).limit(1);
    if (!screenExists) {
      return c.json({ message: `Screen with ID ${id} not found` }, 404);
    }

    const seatList: Seat [] = await db.select().from(seats).where(eq(seats.screenId, Number(id)));
    return c.json({ message: `List of seats for screen ID ${id}`, data: seatList });
  } catch (error: any) {
    console.error('Error fetching seats:', error.message);
    return c.json({ message: 'Error fetching seats', error: error.message }, 500);
  }
})


export default screenRoutes;
