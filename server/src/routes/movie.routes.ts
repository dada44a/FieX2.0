import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movies, shows } from "../db/schema.js";
import { and, eq, gte, lte } from "drizzle-orm/sql/expressions/conditions";
import type { Movie, NewMovie } from "../types.js";

const movieRoutes = new Hono();

movieRoutes.get('/', async (c) => {
  try {
    const db = connectDb();
    const movieList: Movie[] = await db.select().from(movies).execute();
    return c.json({ data: movieList, message: 'List of movies' });
  } catch (error: any) {
    console.error(error);
    return c.json({ message: 'Error fetching movies', error: error.message }, 500);
  }
});

// ? Create a new movie
movieRoutes.post('/', async (c) => {
  const data: NewMovie = await c.req.json();
  try {
    const db = connectDb();
    const newMovie: NewMovie = await db.insert(movies).values(data).returning();
    return c.json({ message: 'Create a new movie', data: newMovie });
  } catch (error: any) {
    console.error('Error creating movie:', error.message);
    return c.json({ message: 'Error creating movie', error: error.message }, 500);
  }
});

movieRoutes.get("/next-three", async (c) => {
  try {
    const db = connectDb();

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 2);

    const todayStr = today.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Fetch movies that have shows in the next 3 days
    const moviesWithShows = await db
      .select({
        id: movies.id,
        title: movies.title,
        genre: movies.genre,
        imageUrl: movies.imageLink,
      })
      .from(movies)
      .innerJoin(shows, eq(movies.id, shows.movieId))
      .where(
        and(
          gte(shows.showDate, todayStr),
          lte(shows.showDate, endDateStr)
        )
      )
      .groupBy(movies.id).execute(); // ensures unique movies

    return c.json({
      message: "Movies with shows in the next 3 days",
      movies: moviesWithShows,
    });
  } catch (error: any) {
    console.error("Error fetching next-three movies:", error);
    return c.json({ message: "Error fetching movies", error: error.message }, 500);
  }
});

movieRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const db = connectDb();
    const movie: Movie = await db.select().from(movies).where(eq(movies.id, Number(id)));
    if (!movie) {
      return c.json({ message: `Movie with ID ${id} not found` }, 404);
    }
    return c.json({ message: `Details of movie with ID ${id}`, data: movie });
  } catch (error: any) {
    return c.json({ message: 'Error fetching movie', error: error.message }, 500);
  }
});

movieRoutes.put('/:id', async (c) => {
  const { id } = c.req.param();
  const data = await c.req.json();
  try {
    const db = connectDb();
    await db.update(movies).set(data).where(eq(movies.id, Number(id))).returning();
    return c.json({ message: `Update movie with ID ${id}`, data });
  } catch (error: any) {
    return c.json({ message: 'Error updating movie', error: error.message }, 500);
  }
});

movieRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const db = connectDb();
    await db.delete(movies).where(eq(movies.id, Number(id))).returning();
    return c.json({ message: `Delete movie with ID ${id}` });
  } catch (error: any) {
    return c.json({ message: 'Error deleting movie', error: error.message }, 500);
  }
});


// movieRoutes.get("/next-3-days", async (c) => {
//   const db = connectDb();

//   const today = new Date();
//   const endDate = new Date();

//   endDate.setDate(today.getDate() + 2); // next 3 days

//   const todayStr = today.toISOString().split("T")[0];
//   const endDateStr = endDate.toISOString().split("T")[0];

//   // Fetch shows within the 3-day range
//   const allShows = await db.select().from(shows).where(
//     and(
//       gte(shows.showDate, todayStr),
//       lte(shows.showDate, endDateStr)
//     )
//   );

//   // Group shows by movieId
//   const movieIdList:Set<number> = new Set();
//   allShows.forEach((show: any) => {
//     movieIdList.add(show.movieId);
//   });

//   return c.json({ message: "Movies with shows in the next 3 days", movieIds: Array.from(movieIdList) });
// });



export default movieRoutes;
