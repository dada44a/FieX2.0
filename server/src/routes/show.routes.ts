import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movies, screens, shows, users } from "../db/schema.js";
import { and, eq, gte, lte } from "drizzle-orm/sql/expressions/conditions";
import type { Movie, NewShow, Show } from "../types.js";

const showRoutes = new Hono();

//  -------------------Helper Function --------------------
const checker = async (db: any, movieId: number, screenId: number, adminId: number) => {
    const existingShow = await db.select().from(shows).where(
        and(
            eq(shows.movieId, movieId),
            eq(shows.screenId, screenId),
            eq(shows.adminId, adminId)
        )
    ).get();

    return existingShow;
}
//-------------------Helper Function --------------------


// get all shows
showRoutes.get('/', async (c) => {
    try {
        const db = connectDb();
        const show: Show[] = await db.select().from(shows);
        return c.json({ message: 'List of shows', data: show });
    }
    catch (error: any) {
        return c.json({ message: 'Internal Server Error', error: error.message }, 500);
    }
});



const checkerDateTime = async (db: any, movieId: number, screenId: number, showDate: string, showTime: string) => {
    const existingShow = await db.select().from(shows).where(
        and(
            eq(shows.movieId, movieId),
            eq(shows.screenId, screenId),
            eq(shows.showDate, showDate),
            eq(shows.showTime, showTime)
        )
    ).get();

    return existingShow;
}

//? Create a new show
showRoutes.post('/', async (c) => {
    const data = await c.req.json();
    try {
        const db = connectDb();
        const movie: Movie = await db.select().from(movies).where(eq(movies.id, data.movieId)).get();

        const checked = await checker(db, data.movieId, data.screenId, data.adminId);
        if (!checked) {
            return c.json({ message: 'Certain data does not exist in database' }, 400);
        }

        const dateTimeCheck = await checkerDateTime(db, data.movieId, data.screenId, data.showDate, data.showTime);
        if (dateTimeCheck) {
            return c.json({ message: 'Show with the same movie, screen, date, and time already exists' }, 400);
        }

        const newShow: NewShow = await db.insert(shows).values({
            movieId: data.movieId,
            showTime: data.showTime,
            showDate: data.showDate,
            adminId: data.adminId,
            screenId: data.screenId
        }).returningAll().get();

        return c.json({ message: 'Show created successfully', show: newShow }, 201);

    }
    catch (err: any) {
        return c.json({ message: 'Internal Server Error', error: err.message }, 500);

    }
});



showRoutes.get('/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const db = connectDb();
        const show: Show = await db.select().from(shows).where(eq(shows.id, Number(id))).get();
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

        const checked = await checker(db, data.movieId, data.screenId, data.adminId);
        if (!checked) {
            return c.json({ message: 'Certain data does not exist in database' }, 400);
        }

        const updatedShow = await db.update(shows).set(data).where(eq(shows.id, Number(id))).returningAll().get();
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