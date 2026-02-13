import { Hono } from "hono";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import { connectDb } from "../db/init.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const testRoutes = new Hono();

testRoutes.post("/jwt-cookie", async (c) => {
    try {
        const { email } = await c.req.json();

        if (!email) {
            return c.json({ error: "Email is required" }, 400);
        }

        const db = connectDb();
        const user = await db.select().from(users).where(eq(users.email, email)).execute();
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }

        const payload = {
            email,
            exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        };

        const secret = process.env.JWT_SECRET || "fallback_secret_change_this";
        const token = await sign(payload, secret);

        setCookie(c, "test_jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            path: "/",
            maxAge: 60 * 60, // 1 hour
        });

        return c.json({ success: true, message: "Cookie set" });
    } catch (error) {
        console.error("JWT Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

export default testRoutes;
