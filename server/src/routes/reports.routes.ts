import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { and, count, eq, gte, lte, sum } from "drizzle-orm";
import { movies, screens, seats, shows, showSeats, tickets, users } from "../db/schema.js";

export const reportsRoutes = new Hono();
reportsRoutes.get("/sales", async (c) => {
  const db = connectDb();

  const data = await db
    .select({
      totalSales: sum(screens.price),
      bookedDate: tickets.paymentDate,
      screenName: screens.name,
    })
    .from(tickets)
    .leftJoin(showSeats, eq(showSeats.showId, tickets.showId))
    .leftJoin(screens, eq(showSeats.screenId, screens.id))
    .groupBy(tickets.paymentDate, screens.name)
    .orderBy(tickets.paymentDate)
    .execute();


  return c.json({ data });
});


reportsRoutes.get("/monthly-stats", async (c) => {
  const db = connectDb();

  // ---------- Get current month start & end ----------
  const now = new Date();
  const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD

  const endOfMonthStr = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD

  // ---------- TOTAL MOVIES (released this month) ----------
  const totalMoviesRes = await db
    .select({ total: count(movies.id) })
    .from(movies)
    .where(
      and(
        gte(movies.releaseDate, startOfMonthStr),
        lte(movies.releaseDate, endOfMonthStr)
      )
    )
    .execute();
  const totalMovies = totalMoviesRes[0].total ?? 0;

  // ---------- TOTAL SHOWS (this month) ----------
  const totalShowsRes = await db
    .select({ total: count(shows.id) })
    .from(shows)
    .where(
      and(
        gte(shows.showDate, startOfMonthStr),
        lte(shows.showDate, endOfMonthStr)
      )
    )
    .execute();
  const totalShows = totalShowsRes[0].total ?? 0;

  // ---------- TOTAL BOOKINGS & REVENUE ----------
  const bookingsRes = await db
    .select({
      totalBookings: count(showSeats.id),
      totalRevenue: sum(screens.price),
    })
    .from(showSeats)
    .leftJoin(tickets, eq(showSeats.ticketId, tickets.id))
    .leftJoin(screens, eq(showSeats.screenId, screens.id))
    .where(
      and(
        eq(showSeats.status, "BOOKED"),
        gte(tickets.paymentDate, startOfMonthStr),
        lte(tickets.paymentDate, endOfMonthStr)
      )
    )
    .execute();

  const totalBookings = bookingsRes[0].totalBookings ?? 0;
  const totalRevenue = bookingsRes[0].totalRevenue ?? 0;

  return c.json({
    month: now.toLocaleString("default", { month: "long" }),
    totalMovies,
    totalShows,
    totalBookings,
    totalRevenue,
  });
});


reportsRoutes.get("/reports", async (c) => {
  const db = connectDb();

  // Get date range from frontend query
  const startDate = c.req.query("start");
  const endDate = c.req.query("end");

  if (!startDate || !endDate) {
    return c.json({ error: "start and end dates are required" }, 400);
  }

  // ---------- TOTAL MOVIES ----------
  const totalMoviesRes = await db
    .select({ total: count(movies.id) })
    .from(movies)
    .where(
      and(
        gte(movies.releaseDate, startDate),
        lte(movies.releaseDate, endDate)
      )
    )
    .execute();

  const totalMovies = totalMoviesRes[0]?.total ?? 0;

  // ---------- TOTAL SHOWS ----------
  const totalShowsRes = await db
    .select({ total: count(shows.id) })
    .from(shows)
    .where(
      and(
        gte(shows.showDate, startDate),
        lte(shows.showDate, endDate)
      )
    )
    .execute();

  const totalShows = totalShowsRes[0]?.total ?? 0;

  // ---------- TOTAL BOOKINGS & REVENUE ----------
  const bookingsRes = await db
    .select({
      totalBookings: count(showSeats.id),
      totalRevenue: sum(screens.price),
    })
    .from(showSeats)
    .leftJoin(tickets, eq(showSeats.ticketId, tickets.id))
    .leftJoin(screens, eq(showSeats.screenId, screens.id))
    .where(
      and(
        eq(showSeats.status, "BOOKED"),
        gte(tickets.paymentDate, startDate),
        lte(tickets.paymentDate, endDate)
      )
    )
    .execute();

  const totalBookings = bookingsRes[0]?.totalBookings ?? 0;
  const totalRevenue = bookingsRes[0]?.totalRevenue ?? 0;

  // ---------- PIE CHART: Revenue by Screen ----------
  const revenueByScreen = await db
    .select({
      screenName: screens.name,
      revenue: sum(screens.price),
    })
    .from(showSeats)
    .leftJoin(tickets, eq(showSeats.ticketId, tickets.id))
    .leftJoin(screens, eq(showSeats.screenId, screens.id))
    .where(
      and(
        eq(showSeats.status, "BOOKED"),
        gte(tickets.paymentDate, startDate),
        lte(tickets.paymentDate, endDate)
      )
    )
    .groupBy(screens.name)
    .execute();

  // ---------- BAR GRAPH: Bookings by Movie ----------
  const bookingsByMovie = await db
    .select({
      movieTitle: movies.title,
      bookings: count(showSeats.id),
    })
    .from(showSeats)
    .leftJoin(tickets, eq(showSeats.ticketId, tickets.id))
    .leftJoin(shows, eq(showSeats.showId, shows.id))
    .leftJoin(movies, eq(shows.movieId, movies.id))
    .where(
      and(
        eq(showSeats.status, "BOOKED"),
        gte(tickets.paymentDate, startDate),
        lte(tickets.paymentDate, endDate)
      )
    )
    .groupBy(movies.title)
    .execute();

  // ---------- LINE GRAPH: Revenue by Date ----------
  const revenueByDate = await db
    .select({
      date: tickets.paymentDate,
      revenue: sum(screens.price),
    })
    .from(showSeats)
    .leftJoin(tickets, eq(showSeats.ticketId, tickets.id))
    .leftJoin(screens, eq(showSeats.screenId, screens.id))
    .where(
      and(
        eq(showSeats.status, "BOOKED"),
        gte(tickets.paymentDate, startDate),
        lte(tickets.paymentDate, endDate)
      )
    )
    .groupBy(tickets.paymentDate)
    .orderBy(tickets.paymentDate)
    .execute();

  // ---------- TABLE DATA: All Bookings ----------
  const tableData = await db
    .select({
      ticketId: tickets.id,
      customerId: tickets.customerId,
      mobile: tickets.mobile,
      movieTitle: movies.title,
      screenName: screens.name,
      seatRow: showSeats.row,
      seatColumn: showSeats.column,
      price: screens.price,
      bookedDate: tickets.paymentDate,
      userName: users.name,
    })
    .from(showSeats)
    .leftJoin(tickets, eq(showSeats.ticketId, tickets.id))
    .leftJoin(shows, eq(showSeats.showId, shows.id))
    .leftJoin(movies, eq(shows.movieId, movies.id))
    .leftJoin(screens, eq(showSeats.screenId, screens.id))
    .leftJoin(users, eq(tickets.customerId, users.clerkId))
    .where(
      and(
        eq(showSeats.status, "BOOKED"),
        gte(tickets.paymentDate, startDate),
        lte(tickets.paymentDate, endDate)
      )
    )
    .execute();

  return c.json({
    summary: { totalMovies, totalShows, totalBookings, totalRevenue },
    pieChart: revenueByScreen,
    barGraph: bookingsByMovie,
    lineGraph: revenueByDate,
    table: tableData,
  });
});