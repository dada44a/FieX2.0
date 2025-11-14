import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movies, screens, shows, users } from "../db/schema.js";
import { and, eq, gte, lte } from "drizzle-orm/sql/expressions/conditions";
import type { Show } from "../types.js";


const showRoutes = new Hono();

//  -------------------Helper Function --------------------

// get all shows
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




const checkerDateTime = async (db: any, screenId: number, showDate: string, showTime: string) => {
    const existingShow = await db.select().from(shows).where(
        and(
            eq(shows.screenId, screenId),
            eq(shows.showDate, showDate),
            eq(shows.showTime, showTime)
        )
    )
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

    if (!movieId || !screenId || !showDate || !showTime) {
      console.log("❌ Missing fields:", body);
      return c.json({ error: "All fields are required" }, 400);
    }

    const db = connectDb();
    console.log("🗄️ DB Connected!");

    console.log("🔎 Checking existing show...");
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
      console.log("❌ Duplicate show detected.");
      return c.json(
        { message: "Show with same screen, date & time already exists" },
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


showRoutes.get("/next-3-days", async (c) => {
    const db = connectDb();
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 2); // next 3 days

    // Fetch shows within the 3-day range
    const allShows = await db.select().from(shows).where(
        and(
            gte(shows.showDate, today.toISOString().split("T")[0]),
            lte(shows.showDate, endDate.toISOString().split("T")[0])
        )
    );

    const grouped: Record<string, typeof allShows> = {};
    allShows.forEach((show: any) => {
        const date = show.showDate.toISOString().split("T")[0]; // YYYY-MM-DD
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(show);
    });
    return c.json({ message: "Shows for the next 3 days", data: grouped });
});


export default showRoutes;
