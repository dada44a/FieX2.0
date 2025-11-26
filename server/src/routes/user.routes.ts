import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { User } from "../types.js";

const userRoutes = new Hono();


userRoutes.get("/", async (c) => {
    const db = connectDb();
    const allUsers = await db.select().from(users).execute();
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

userRoutes.put("/:id", async (c) => {
    try {
        const db = connectDb();
        const id = c.req.param("id");
        const body = await c.req.json() as Partial<User>;
        const result = await db
            .update(users)
            .set({
                role: body.role,
            })
            .where(eq(users.id, Number(id)))
            .execute();
        return c.json({ message: "User updated successfully" });
    } catch (error) {
        return c.json({ error: "Failed to update user" }, 500);
    }
})

userRoutes.delete("/:id", async (c) => {
    try {
        const db = connectDb();
        const id = c.req.param("id");
        const result = await db
            .delete(users)
            .where(eq(users.id, Number(id)))
            .execute();
        return c.json({ message: "User deleted successfully" });
    } catch (error) {
        return c.json({ error: "Failed to delete user" }, 500);
    }
});

export default userRoutes;