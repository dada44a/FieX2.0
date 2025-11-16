import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movies, screens, shows, users } from "../db/schema.js";
import { and, eq, gte, lte } from "drizzle-orm/sql/expressions/conditions";
import type { Show } from "../types.js";
import { inngest } from "../inngest/index.js";


const showRoutes = new Hono();

showRoutes.get('/', async (c) => {
  try {
    const db = connectDb();
    const show: Show[] = await db.select().from(shows);

    const responseData = await Promise.all(
      show.map(async (s) => {
        const movie = await db
          .select({ title: movies.title })
          .from(movies)
          .where(eq(movies.id, s.movieId))
          .limit(1).execute(); // fetch single movie

        const screen = await db
          .select({ name: screens.name })
          .from(screens)
          .where(eq(screens.id, s.screenId))
          .limit(1).execute(); // fetch single screen

        return {
          ...s,
          movieTitle: movie ? movie[0].title : null,
          screenName: screen ? screen[0].name : null,
        };
      })
    );
    return c.json({ message: 'List of shows', data: responseData });
  } catch (error: any) {
    return c.json({ message: 'Internal Server Error', error: error.message }, 500);
  }
});

//? Create a new show
showRoutes.post("/", async (c) => {
  console.log("📥 Incoming POST /shows");

  try {
    const body = await c.req.json().catch((e) => {
      console.log("Could not parse body:", e);
      return null;
    });

    console.log("🧪 Parsed body:", body);

    if (!body) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { movieId, screenId, showDate, showTime } = body;

    if (!movieId || !screenId || !showDate || !showTime) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const db = connectDb();
    const existingShow = await db
      .select()
      .from(shows)
      .where(
        and(
          eq(shows.screenId, screenId),
          eq(shows.showDate, showDate),
          eq(shows.showTime, showTime)
        )
      )
      .execute();

    console.log("Result existingShow:", existingShow);

    if (existingShow.length > 0) {
      console.log(" Duplicate show detected.");
      return c.json(
        { message: "Show with same screen, date & time already exists" },
        400
      );
    }

    const inserted = await db
      .insert(shows)
      .values({
        movieId,
        screenId,
        showDate,
        showTime,
      })
      .returning();

    console.log("✅ Inserted row:", inserted);

    try {
      await inngest.send({
        name: "show/show-seats",
        data: { showId: inserted[0].id, screenId },
      });
    } catch (e) {
      console.error("Failed to send Inngest event:", e);
    }

    return c.json(
      { message: "Show created successfully" },
      201
    );
  } catch (err: any) {
    console.error("🔥 INTERNAL ERROR:", err);
    return c.json(
      { message: "Internal Server Error", error: err.message },
      500
    );
  }
});

showRoutes.get("/:id/next-three", async (c) => {
  try {
    const db = connectDb();
    const movieId = Number(c.req.param("id")); // get movie id from params

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 2); // next 3 days

    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = formatDate(today);
    const endDateStr = formatDate(endDate);

    // Join movies with shows and filter by movieId & date range
    const rows = await db
      .select({
        movieId: movies.id,
        title: movies.title,
        imageLink: movies.imageLink,
        genre: movies.genre,
        description: movies.description,
        showId: shows.id,
        showDate: shows.showDate,
        screenId: shows.screenId
      })
      .from(movies)
      .leftJoin(shows, eq(shows.movieId, movies.id))
      .where(
        and(
          eq(movies.id, movieId),
          gte(shows.showDate, todayStr),
          lte(shows.showDate, endDateStr)
        )
      );

    if (!rows.length) return c.json({ message: "No shows found or movie not found" }, 404);

    // Extract movie details (same for all rows)
    const { movieId: id, title, description, imageLink, genre } = rows[0];

    // Group shows by date
    const grouped: Record<string, typeof rows[0][]> = {};
    rows.forEach((row: any) => {
      const dateStr = row.showDate instanceof Date ? formatDate(row.showDate) : row.showDate;
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(row);
    });

    return c.json({
      movieDetails: { id, title, description, imageLink, genre },
      shows: grouped
    });

  } catch (err) {
    console.error("Error fetching movie shows:", err);
    return c.json({ message: "Internal server error", error: String(err) }, 500);
  }
});

showRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const db = connectDb();
    const show: Show = await db.select().from(shows).where(eq(shows.id, Number(id)));
    if (!show) {
      return c.json({ message: `Show with ID: ${id} not found` }, 404);
    }
    return c.json({ message: `Get show with ID: ${id}`, show });
  }
  catch (err: any) {
    return c.json({ message: 'Internal Server Error', error: err.message }, 500);
  }
});



showRoutes.put('/:id', async (c) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  try {
    const db = connectDb();



    const updatedShow = await db.update(shows).set(data).where(eq(shows.id, Number(id))).execute();
    return c.json({ message: `Update show with ID: ${id}`, show: updatedShow });
  }
  catch (err: any) {
    return c.json({ message: 'Internal Server Error', error: err.message }, 500);
  }
});

showRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const db = connectDb();

    await db.delete(shows).where(eq(shows.id, Number(id)));
    return c.json({ message: `Delete show with ID: ${id}` });

  }
  catch (err: any) {
    return c.json({ message: 'Internal Server Error', error: err.message }, 500);
  }

});



export default showRoutes;
