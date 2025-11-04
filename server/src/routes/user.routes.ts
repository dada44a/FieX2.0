import { Hono } from "hono";
import { connectDb } from "../db/init.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { User } from "../types.js";

const userRoutes = new Hono();


// ------ Helper Function to update user points ------  
export const updateUserPoints = async (clerkId: string, pointsToAdd: number, db: any) => {
    const userExists: User  = await db.select().from(users).where(eq(users.clerkId, String(clerkId))).limit(1);
    if (!userExists) {
        throw new Error(`User with Clerk ID ${clerkId} does not exist`);
    }
    const currentPoints = userExists.points || 0;
    const newPoints = currentPoints + pointsToAdd;
    await db.update(users).set({ points: newPoints }).where(eq(users.clerkId, String(clerkId))).returning();
    return { success: true, points: newPoints };
};
// ------ Helper Function to update user points ------



// ? GET all users

userRoutes.get('/', async (c) => {
    try {
        const db = connectDb();
        const usersList = await db.select().from(users);
        return c.json({ message: 'List of users', data: usersList });
    } catch (error: any) {
        return c.json({ message: 'Error fetching users', error: error.message }, 500);
    }
});

// ? create a new user
userRoutes.post('/', async (c) => {
    const data = await c.req.json();

    try {
        const db = connectDb();
        const newUser = await db.insert(users).values(data).returning();
        return c.json({ message: 'Create a new user', data: newUser });
    }
    catch (error: any) {
        return c.json({ message: 'Create a new user', error: error.message }, 500);
    }
});

// ? get user by id
userRoutes.get('/:id', async (c) => {
    const { id } = c.req.param();
    try{
        const db = connectDb();
        const user = await db.select().from(users).where(eq(users.clerkId, String(id)));
        if (user.length === 0) {
            return c.json({ message: `User with ID ${id} not found` }, 404);
        }
        return c.json({ message: `Details of user with ID ${id}`, data: user[0] });
    } catch (error: any) {
        return c.json({ message: `Details of user with ID ${id}`, error: error.message }, 500);
    }
});

//? update user role
userRoutes.put("/:id/role", async (c) => {
    const { id } = c.req.param();
    const data = await c.req.json();
    try {
        const db = connectDb();
        const userExists = await db.select().from(users).where(eq(users.clerkId, String(id))).limit(1);
        if (!userExists) {
            return c.json({ message: `User with Clerk ID ${id} does not exist` }, 400);
        }
        await db.update(users).set({ role: data.role }).where(eq(users.clerkId, String(id))).returning();
        return c.json({ message: `Update role of user with ID ${id}`, data });
    } catch (error: any) {
        return c.json({ message: `Update role of user with ID ${id}`, error: error.message }, 500);
    }
});

// ? update points



userRoutes.delete('/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const db = connectDb();
        const deletedUser = await db.delete(users).where(eq(users.id, Number(id))).returning();
        if (deletedUser.length === 0) {
            return c.json({ message: `User with ID ${id} not found` }, 404);
        }
        return c.json({ message: `User with ID ${id} deleted successfully`, data: deletedUser[0] });
    } catch (error: any) {
        return c.json({ message: `Delete user with ID ${id}`, error: error.message }, 500);
    }
});

export default userRoutes;