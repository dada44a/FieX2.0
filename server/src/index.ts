import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import seatRoutes from "./routes/seat.routes.js";
import screenRoutes from "./routes/screen.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import userRoutes from "./routes/user.routes.js";
import showRoutes from "./routes/show.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import { cors } from "hono/cors";
import { functions, inngest } from "./inngest/index.js";
import { serve as InngestServe } from "inngest/hono";
import testRoutes from "./routes/test.route.js";
import { reportsRoutes } from "./routes/reports.routes.js";
import requestRoutes from "./routes/request.routes.js";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { authMiddleware } from "./middleware/authmiddleware.js";

export const app = new Hono();

app.use("*", prettyJSON());
app.use("*", cors(
  { origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }
));
app.use("/api/inngest", InngestServe({ client: inngest, functions }));

app.use("*", authMiddleware)
app.use("*", clerkMiddleware());
// routes
app.route("/api/seats", seatRoutes);
app.route("/api/screens", screenRoutes);
app.route("/api/movies", movieRoutes);
app.route("/api/users", userRoutes);
app.route("/api/shows", showRoutes);
app.route("/api/tickets", ticketRoutes);
app.route("/api/test", testRoutes);
app.route("/api/reports", reportsRoutes);
app.route("/api/requests", requestRoutes);


app.get('/', async (c) => {

  return c.json({ message: 'Welcome to the Movie Theater API' });
})

app.post("/initiate", async (c) => {
  try {
    const {
      name,
      email,
      phone,
      amount,
      purchase_order_name,
      showId,
      customerId,
    } = await c.req.json();

    const res = await fetch(
      "https://dev.khalti.com/api/v2/epayment/initiate/",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          return_url: `${process.env.FRONTEND_URL}/protected/movie/payment-success?showId=${showId}&customerId=${customerId}&phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}`,
          website_url: process.env.FRONTEND_URL,
          amount,
          purchase_order_id: Date.now().toString(),
          purchase_order_name,
          customer_info: { name, email, phone },
        }),
      },
    );

    const khalti = await res.json();

    if (!res.ok) {
      console.error("Khalti API Error:", khalti);
      return c.json({ error: "Failed to initiate payment", details: khalti }, 400);
    }

    // 🔥 Return payment_url directly to frontend
    return c.json({
      success: true,
      payment_url: khalti.payment_url,
      pidx: khalti.pidx,
      showId,
      customerId,
    });
  } catch (err) {
    console.error("Khalti Error:", err);
    return c.json({ error: "Failed to initiate payment" }, 500);
  }
});

app.get("/test", authMiddleware, async (c) => {
  return c.json({ message: "Test route is working!" });
})

serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
export default app;