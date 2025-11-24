import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movies, screens, shows, tickets, users } from "../db/schema.js";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";
import type { NewTicket, Ticket } from "../types.js";
import { updateUserPoints } from "./user.routes.js";

const ticketRoutes = new Hono();

//  -------------------Helper Function --------------------
const checker = async (db: any, showId: number, userId: string) => {
    const existingTicket = await db.select().from(tickets).where(
        and(
            eq(shows.id, showId),
            eq(users.clerkId, userId),
        )
    ).get();

    return existingTicket;
}
// -------------------Helper Function --------------------

// get all tickets
ticketRoutes.get('/', async (c) => {
    try {
        const db = connectDb();
        const ticket: Ticket[] = await db.select({
            id: tickets.id,
            customer: tickets.customerId,
            movie: movies.title,
            genre: movies.genre,
            show: shows.id,
            paymentDate: tickets.paymentDate,
            transactionId: tickets.transactionId,
            pidx: tickets.pidx,
            screen: screens.name,
            showTime: shows.showTime,
            showDate: shows.showDate,

        }).from(tickets).innerJoin(shows, eq(tickets.showId, shows.id)).innerJoin(movies, eq(movies.id, shows.movieId)).innerJoin(screens, eq(screens.id, shows.screenId));
        return c.json({ message: 'List of tickets', data: ticket });
    }
    catch (error: any) {
        return c.json({ message: 'Internal Server Error', error: error.message }, 500);
    }
});




//? Get ticket by ID
ticketRoutes.get('/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const db = connectDb();
        const ticket: Ticket = await db.select().from(tickets).where(eq(tickets.id, Number(id)));
        if (!ticket) {
            return c.json({ message: `Ticket with ID ${id} not found` }, 404);
        }
        return c.json({ message: `Details of ticket with ID ${id}`, data: ticket });
    } catch (error: any) {
        return c.json({ message: 'Error fetching ticket', error: error.message }, 500);
    }
});



export default ticketRoutes;    