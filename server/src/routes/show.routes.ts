import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movies, screens, shows, users } from "../db/schema.js";
import { and, eq, gte, lte } from "drizzle-orm/sql/expressions/conditions";
import type { Show } from "../types.js";
import { inngest } from "../inngest/index.js";


const showRoutes = new Hono();

//  -------------------Helper Function --------------------

// get all shows
showRoutes.get('/', async (c) => {
  try {
    const db = connectDb();
    const show: Show[] = await db.select().from(shows).execute();

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

    console.log("Fetched shows:", responseData);
    return c.json({ message: 'List of shows', data: responseData });
  } catch (error: any) {
    return c.json({ message: 'Internal Server Error', error: error.message }, 500);
  }
});




const checkerDateTime = async (db: any, screenId: number, showDate: string, showTime: string) => {
  const existingShow = await db.select().from(shows).where(
    and(
      eq(shows.screenId, screenId),
      eq(shows.showDate, showDate),
      eq(shows.showTime, showTime)
    )
  ).execute();
  if (existingShow.length > 0) {
    return existingShow[0];
  }
  return null;
}

//? Create a new show
showRoutes.post("/", async (c) => {
  console.log("📥 Incoming POST /shows");

  try {
    const body = await c.req.json().catch((e) => {
      console.log("❌ Could not parse body:", e);
      return null;
    });

    console.log("🧪 Parsed body:", body);

    if (!body) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { movieId, screenId, showDate, showTime } = body;

    const missing: string[] = [];
    if (!movieId) missing.push("movieId");
    if (!screenId) missing.push("screenId");
    if (!showDate) missing.push("showDate");
    if (!showTime) missing.push("showTime");

    if (missing.length > 0) {
      console.log("❌ Missing fields:", missing);
      return c.json({ error: `Missing fields: ${missing.join(", ")}` }, 400);
    }

    const db = connectDb();

    // ✅ Check for duplicates
    const alreadyExists = await checkerDateTime(db, screenId, showDate, showTime);
    console.log("Checking for existing show:", alreadyExists);
    if (alreadyExists !== null) {
      return c.json(
        { message: "Show with the same screen, date, and time already exists" },
        400
      );
    }

    console.log("🟢 No duplicate. Inserting...");

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
    // invoke inngest function showSeat
    await inngest.send({
      name: "show/show-seats",
      data: {
        showId: inserted[0].id,
        screenId: inserted[0].screenId,
      },
    });

    return c.json(
      { message: "Show created successfully", show: inserted[0] },
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
    const movieId = Number(c.req.param("id"));
    if (isNaN(movieId)) return c.json({ message: "Invalid movie ID" }, 400);

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 2);

    const todayStr = today.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Fetch shows with movie info
    const rows = await db
      .select({
        showId: shows.id,
        showDate: shows.showDate,
        showTime: shows.showTime,
        screenId: shows.screenId,
        title: movies.title,
        genre: movies.genre,
        imageUrl: movies.imageLink,
        description: movies.description,
        release: movies.releaseDate,
      })
      .from(shows)
      .innerJoin(movies, eq(movies.id, shows.movieId))
      .where(
        and(
          eq(shows.movieId, movieId),
          gte(shows.showDate, todayStr),
          lte(shows.showDate, endDateStr)
        )
      )
      .groupBy(
        shows.id,
        movies.id
      )
      .execute();

    if (!rows.length) {
      return c.json({ message: "No shows found", movie: null, shows: {} });
    }

    // Group shows by date in JS (fast for small datasets like 3 days)
    const showsByDate: Record<string, any[]> = {};
    rows.forEach((row: any) => {
      const date = row.showDate; // Already a string in your DB
      if (!showsByDate[date]) showsByDate[date] = [];
      showsByDate[date].push({
        showId: row.showId,
        showTime: row.showTime,
        screenId: row.screenId,
      });
    });

    // Movie info (all rows have same movie data)
    const { title, genre, imageUrl, description, release } = rows[0];

    return c.json({
      message: "Shows for this movie in the next 3 days",
      movie: { title, genre, imageUrl, description, release },
      shows: showsByDate,
    });
  } catch (err: any) {
    console.error(err);
    return c.json({ message: "Internal server error", error: err.message }, 500);
  }
});


showRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const db = connectDb();
    const result = await db.select().from(shows).where(eq(shows.id, Number(id))).execute();
    const show = result[0];
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
