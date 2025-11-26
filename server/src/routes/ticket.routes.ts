import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movies, screens, shows, showSeats, tickets, users } from "../db/schema.js";
import { and, eq, inArray } from "drizzle-orm/sql/expressions/conditions";
import type { NewTicket, Ticket } from "../types.js";
import { updateUserPoints } from "./user.routes.js";

const ticketRoutes = new Hono();

ticketRoutes.get("/", async (c) => {
  try {
    const db = connectDb();
    const ticket: Ticket[] = await db
      .select({
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
      })
      .from(tickets)
      .innerJoin(shows, eq(tickets.showId, shows.id))
      .innerJoin(movies, eq(movies.id, shows.movieId))
      .innerJoin(screens, eq(screens.id, shows.screenId));



    return c.json({ message: "List of tickets", data: ticket });
  } catch (error: any) {
    return c.json(
      { message: "Internal Server Error", error: error.message },
      500,
    );
  }
});

ticketRoutes.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const db = connectDb();

    // 1️⃣ Fetch all tickets for the customer
    const ticketsForUser: Ticket[] = await db
      .select({
        id: tickets.id,
        movie: movies.title,
        genre: movies.genre,
        screen: screens.name,
        showTime: shows.showTime,
        showDate: shows.showDate,
      })
      .from(tickets)
      .innerJoin(shows, eq(tickets.showId, shows.id))
      .innerJoin(movies, eq(movies.id, shows.movieId))
      .innerJoin(screens, eq(screens.id, shows.screenId))
      .where(eq(tickets.customerId, id));

    if (ticketsForUser.length === 0) {
      return c.json({ message: "No tickets found", data: [] });
    }

    // 2️⃣ Get all ticket IDs
    const ticketIds = ticketsForUser.map((t) => t.id);

    // 3️⃣ Fetch seats for those tickets
    const seats = await db
      .select({ row: showSeats.row, column: showSeats.column, ticketId: showSeats.ticketId })
      .from(showSeats)
      .where(inArray(showSeats.ticketId, ticketIds));

    // 4️⃣ Group seats under each ticket
    const ticketsWithSeats = ticketsForUser.map((ticket) => {
      // Get seats for this ticket
      const seatsForThisTicket = seats
        .filter((s:any) => s.ticketId === ticket.id)
        .map((s:any) => `${s.row}${s.column}`); // e.g. "A1", "B2"

      return {
        ...ticket,
        seats: seatsForThisTicket,
      };
    });

    return c.json({ message: "Tickets with seats", data: ticketsWithSeats });
  } catch (error: any) {
    return c.json({ message: "Internal Server Error", error: error.message }, 500);
  }
});


export default ticketRoutes;
