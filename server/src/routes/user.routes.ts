import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { User } from "../types.js";

const userRoutes = new Hono();


userRoutes.get("/", async (c) => {
    const db = connectDb();
    const allUsers: User[] = await db.select().from(users);
    return c.json(allUsers);
});

userRoutes.get("/:id", async (c) => {
    const db = connectDb();
    const id = c.req.param("id");
    const user = (await db
        .select({
            role: users.role,
        })
        .from(users)
        .where(eq(users.clerkId, id))
        .limit(1)
        .execute())?.[0];
    if (!user) {
        return c.json({ error: "User not found" }, 404);
    }
    return c.json(user);
});

export default userRoutes;