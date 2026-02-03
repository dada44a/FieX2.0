import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movies, screens, shows, showSeats, tickets, users } from "../db/schema.js";
import { and, eq, inArray } from "drizzle-orm/sql/expressions/conditions";
import QRCode from 'qrcode'
import type { NewTicket, Ticket } from "../types.js";

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
        .filter((s: any) => s.ticketId === ticket.id)
        .map((s: any) => `${s.row}${s.column}`); // e.g. "A1", "B2"

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


ticketRoutes.get("/:id/qr", async (c) => {
  try {
    const { id } = c.req.param();
    const db = connectDb();

    const ticketsForUser = await db
      .select({
        id: tickets.id,
        isUsed: tickets.isUsed,
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
      .where(eq(tickets.id, Number(id)));

    if (ticketsForUser.length === 0) {
      return c.json({ message: "No tickets found", data: null });
    }

    const ticket = ticketsForUser[0];

    const seats = await db
      .select({
        row: showSeats.row,
        column: showSeats.column,
        ticketId: showSeats.ticketId
      })
      .from(showSeats)
      .where(eq(showSeats.ticketId, ticket.id));

    const qrData = {
      ...ticket,
      isUsed: ticket.isUsed,
      seats: seats.map((s: any) => `${s.row}${s.column}`)
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    return c.json({
      message: "Ticket with seats",
      data: {
        data: qrData,
        qrCode
      }
    });

  } catch (error: any) {
    return c.json({ message: "Internal Server Error", error: error.message }, 500);
  }
});

ticketRoutes.put("/used/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const db = connectDb();

    const ticketIsUsed = await db.select().from(tickets).where(eq(tickets.id, Number(id)));

    if (ticketIsUsed.length === 0) {
      return c.json({ message: "Ticket not found", data: null }, 404);
    }

    if (ticketIsUsed[0].isUsed) {
      return c.json({ message: "Ticket already used", data: null }, 400);
    }

    const ticket = await db.update(tickets).set({ isUsed: true }).where(and(eq(tickets.id, Number(id)), eq(tickets.isUsed, false)));

    return c.json({ message: "Ticket updated", data: ticket });
  } catch (error: any) {
    return c.json({ message: "Internal Server Error", error: error.message }, 500);
  }
});


ticketRoutes.post("/validate", async (c) => {
  try {
    const { ticketId } = await c.req.json();
    if (!ticketId) return c.json({ message: "Ticket ID is required" }, 400);

    const db = connectDb();

    // 1. Fetch Ticket & Show Details
    const ticketData = await db
      .select({
        id: tickets.id,
        isUsed: tickets.isUsed,
        showDate: shows.showDate,
        showTime: shows.showTime,
        movieTitle: movies.title,
      })
      .from(tickets)
      .innerJoin(shows, eq(tickets.showId, shows.id))
      .innerJoin(movies, eq(shows.movieId, movies.id))
      .where(eq(tickets.id, Number(ticketId)))
      .execute();

    if (!ticketData.length) {
      return c.json({ success: false, message: "Invalid Ticket ID" }, 404);
    }

    const ticket = ticketData[0];

    // 2. Check if already used
    if (ticket.isUsed) {
      return c.json({ success: false, message: "Ticket already used" }, 400);
    }

    // 3. Time Validation (Cannot validate 1 hour after start)
    const showDateTimeStr = `${ticket.showDate}T${ticket.showTime}`;
    const showStart = new Date(showDateTimeStr);
    const now = new Date();

    // Add 1 hour buffer
    const validationDeadline = new Date(showStart.getTime() + 60 * 60 * 1000);

    if (now > validationDeadline) {
      return c.json({
        success: false,
        message: "Validation Expired: Show started over 1 hour ago."
      }, 400);
    }

    // 4. Mark as Used
    await db
      .update(tickets)
      .set({ isUsed: true })
      .where(eq(tickets.id, Number(ticketId)))
      .execute();

    return c.json({
      success: true,
      message: "Ticket Verified Successfully",
      data: {
        movie: ticket.movieTitle,
        showTime: ticket.showTime
      }
    });

  } catch (error: any) {
    console.error("Validation Error:", error);
    return c.json({ success: false, message: "Server Error", error: error.message }, 500);
  }
});

export default ticketRoutes;
