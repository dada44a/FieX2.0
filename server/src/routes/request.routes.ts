
import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { movieRequests } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";

const requestRoutes = new Hono();

// Create a new movie request (Public/User)
requestRoutes.post("/", async (c) => {
    try {
        const { movieTitle, description, userId } = await c.req.json();

        if (!movieTitle) {
            return c.json({ message: "Movie title is required" }, 400);
        }

        const db = connectDb();
        const result = await db
            .insert(movieRequests)
            .values({
                movieTitle,
                description,
                userId, // Optional
            })
            .returning();

        return c.json({ message: "Request submitted successfully", request: result[0] }, 201);
    } catch (error: any) {
        return c.json({ message: "Internal Server Error", error: error.message }, 500);
    }
});

// Get all requests (Admin)
requestRoutes.get("/", async (c) => {
    try {
        const db = connectDb();
        const requests = await db
            .select()
            .from(movieRequests)
            .orderBy(desc(movieRequests.createdAt));

        return c.json({ message: "All requests", data: requests });
    } catch (error: any) {
        return c.json({ message: "Internal Server Error", error: error.message }, 500);
    }
});

// Update request status (Admin)
requestRoutes.put("/:id/status", async (c) => {
    try {
        const { id } = c.req.param();
        const { status } = await c.req.json();

        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return c.json({ message: "Invalid status" }, 400);
        }

        const db = connectDb();
        const result = await db
            .update(movieRequests)
            .set({ status })
            .where(eq(movieRequests.id, Number(id)))
            .returning();

        if (!result.length) {
            return c.json({ message: "Request not found" }, 404);
        }

        return c.json({ message: "Status updated", request: result[0] });
    } catch (error: any) {
        return c.json({ message: "Internal Server Error", error: error.message }, 500);
    }
});

export default requestRoutes;
