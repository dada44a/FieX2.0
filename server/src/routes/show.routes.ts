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
    )
    if (existingShow.length > 0) {
        return existingShow[0];
    }
    return null;
}

//? Create a new show
showRoutes.post("/", async (c) => {
    try {
        const data = await c.req.json();
        const { movieId, screenId, showDate, showTime } = data;
        if (!movieId || !screenId || !showDate || !showTime) {
            return c.json({ error: "All fields are required" }, 400);
        }

        const db = connectDb();

        // ✅ Check for duplicates
        const alreadyExists = await checkerDateTime(db,screenId, showDate, showTime);
        console.log("Checking for existing show:", alreadyExists);
        if (alreadyExists!== null) {
            return c.json(
                { message: "Show with the same screen, date, and time already exists" },
                400
            );
        }

        // ✅ Insert safely (Drizzle returns an array)
        const inserted = await db
            .insert(shows)
            .values({
                movieId,
                screenId,
                showDate,
                showTime,
            });

        return c.json(
            { message: "Show created successfully", show: inserted[0] },
            201
        );
    } catch (err: any) {
        console.error("❌ Error adding show:", err);
        return c.json({ message: "Internal Server Error", error: err.message }, 500);
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