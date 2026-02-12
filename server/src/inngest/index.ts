import { Inngest, step } from "inngest";
import { connectDb } from "../db/init.js";
import { and, eq, lte, ne } from "drizzle-orm";
import { seats, shows, showSeats, tickets, users } from "../db/schema.js";

import Brevo from '@getbrevo/brevo';

// Create a client to send and receive events


import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export const inngest = new Inngest({ id: "my-app", eventKey:process.env.INNGEST_EVENT_KEY, signingKey: process.env.INNGEST_SIGNING_KEY });
export const sendEmail = async ({ to, subject, html }: any) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP,
      port: Number(process.env.BREVO_PORT),
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });

    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.BREVO_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
};



const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

const showSeat = inngest.createFunction(
  { id: "seat_create" },
  { event: "show/show-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const { showId, screenId } = event.data;

      // seats table should have `row` and `column` = total seats in that row
      const seatRows = await db
        .select({ row: seats.row, totalSeats: seats.column }) // column = total seats in that row
        .from(seats)
        .where(eq(seats.screenId, Number(screenId)));

      if (!seatRows.length) {
        return {
          success: false,
          error: "No seat layout found for this screen",
        };
      }

      const showSeatsRows: any[] = [];

      seatRows.forEach((seatRow: any) => {
        const rowName = seatRow.row;
        const total = seatRow.totalSeats;

        for (let col = 1; col <= total; col++) {
          showSeatsRows.push({
            showId: Number(showId),
            screenId: Number(screenId),
            row: rowName,
            column: col,
            isBooked: false,
          });
        }
      });

      await db.insert(showSeats).values(showSeatsRows);

      return { success: true, created: showSeatsRows.length };
    } catch (err: any) {
      console.error("Failed to create show seats:", err);
      return { success: false, error: err.message };
    }
  },
);

const inActiveSeats = inngest.createFunction(
  { id: "inactive-seats" },
  { event: "booking/inactive-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const { id, userId } = event.data;

      const result = await db
        .update(showSeats)
        .set({
          status: "SELECTED",
          booked_by: userId,
        })
        .where(and(eq(showSeats.id, id), ne(showSeats.status, "BOOKED")))
        .returning()
        .execute();

      const updatedSeat = result[0];
      await step.sleep("release-seat-after-5-minutes", "2mins");

      const seatCheck = await db
        .select()
        .from(showSeats)
        .where(eq(showSeats.id, updatedSeat.id))
        .then((res: any) => res[0]);

      if (!seatCheck) {
        return { success: false, message: "Seat not found after 5 minutes." };
      }

      // If still SELECTED → return to AVAILABLE
      if (seatCheck.status === "SELECTED") {
        await db
          .update(showSeats)
          .set({
            status: "AVAILABLE",
            booked_by: null,
          })
          .where(eq(showSeats.id, updatedSeat.id))
          .execute();
      }

      return { success: true, updated: result.rowCount, seats: result };
    } catch (err: any) {
      console.error("Failed to mark seats as inactive:", err);
      return { success: false, error: err.message };
    }
  },
);

const bookSeats = inngest.createFunction(
  { id: "book-seats" },
  { event: "booking/book-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const now = new Date();
      const time = now.toLocaleTimeString();
      const { id, userId, transaction_id, phone, pidx, email } = event.data;
      const result = await db
        .update(showSeats)
        .set({
          status: "BOOKED",
          booked_by: userId,
          bookedTime: time as string,

        })
        .where(
          and(
            eq(showSeats.showId, id),
            eq(showSeats.booked_by, userId),
            eq(showSeats.status, "SELECTED"),
          ),
        )
        .execute();

      const data = await db
        .insert(tickets)
        .values({
          paymentMethod: "KHALTI",
          paymentDate: new Date(),
          customerId: userId,
          showId: Number(id),
          transactionId: transaction_id,
          mobile: phone,
          pidx,
          bookedTime: time as string,
        })
        .returning();

      const ticket_id = await data[0].id;
      const bookedTime = await data[0].bookedTime;

      await db
        .update(showSeats)
        .set({
          ticketId: ticket_id,
        })
        .where(
          and(
            eq(showSeats.showId, id),
            eq(showSeats.booked_by, userId),
            eq(showSeats.status, "BOOKED"),
            eq(showSeats.bookedTime, bookedTime),
          ),
        )
        .execute();

      await inngest.send({
        name: "ticket/send-email",
        data: {
          ticket_id,
          userId,
          email,
        },
      });





      return { success: true, updated: result.rowCount };
    } catch (err: any) {
      console.error("Failed to mark seats as inactive:", err);
      return { success: false, error: err.message };
    }
  },
);


const reserve_seats = inngest.createFunction(
  { id: "reserve-seats" },
  { event: "booking/reserve-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const now = new Date();
      const time = now.toLocaleTimeString();
      const { id, userId } = event.data;
      const result = await db
        .update(showSeats)
        .set({
          status: "RESERVED",
          booked_by: userId,
          bookedTime: time as string,

        })
        .where(
          and(
            eq(showSeats.showId, id),
            eq(showSeats.booked_by, userId),
            eq(showSeats.status, "SELECTED"),
          ),
        )
        .returning()
        .execute();

      const updatedCount = result.length;

      const reservedSeatsCount = await db
        .select({
          reservedSeats: shows.reservedSeats
        })
        .from(shows)
        .where(eq(shows.id, Number(id)))
        .then((res: any) => res[0].reservedSeats);

      await db.update(shows).set({
        reservedSeats: reservedSeatsCount + updatedCount,
      })
        .where(and(eq(shows.id, Number(id)), lte(shows.reservedSeats, 5)))
        .execute();

      return { success: true, updated: result.rowCount };
    } catch (err: any) {
      console.error("Failed to mark seats as inactive:", err);
      return { success: false, error: err.message };
    }
  },
);

const sendTicketEmail = inngest.createFunction(
  { id: "send-ticket-email" },
  { event: "ticket/send-email" },
  async ({ event, step }) => {
    try {
      const { ticket_id, userId, email: passedEmail } = event.data;

      const db = connectDb();
      const user = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.clerkId, userId))
        .then((res: any) => res[0]);

      await step.sleep("wait-before-fetch", "30s"); // wait 30 seconds

      const apiUrl = process.env.VITE_API_LINK || 'http://localhost:4000';
      console.log(`Fetching QR data from: ${apiUrl}/api/tickets/${ticket_id}/qr`);
      const fetched = await fetch(`${apiUrl}/api/tickets/${ticket_id}/qr`);

      if (!fetched.ok) {
        throw new Error(`Failed to fetch QR data: ${fetched.status} ${fetched.statusText}`);
      }

      const { data } = await fetched.json();
      if (!data) throw new Error("Ticket data not found");
      const { data: qrData, qrCode } = data;
      const subject = "Your Movie Ticket";
      const html = `
        <h1>Your Movie Ticket</h1>
        <p>Here are your ticket details:</p>
        <ul>
          <li>Movie: ${qrData.movie}</li>
          <li>Genre: ${qrData.genre}</li>
          <li>Screen: ${qrData.screen}</li>
          <li>Show Time: ${qrData.showTime}</li>
          <li>Show Date: ${qrData.showDate}</li>
          <li>Seats: ${qrData.seats.join(', ')}</li>
        </ul>
        <p>Please find your QR code attached.</p>
        <img src="cid:ticketImage" style="width:200px;" />
      `;

      const transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP,
        port: Number(process.env.BREVO_PORT),
        secure: false,
        auth: {
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_SMTP_KEY,
        }
      });

      async function sendTicket() {
        const info = await transporter.sendMail({
          from: `"FireX Cinema" <dada44w@gmail.com>`,
          to: user?.email || passedEmail,
          subject: "Your Movie Ticket",
          html: html,
          attachments: [
            {
              filename: 'ticket-qr.png',
              content: Buffer.from(qrCode.split(",")[1], 'base64'),
              cid: 'ticketImage' // same cid value as in the html img src
            }
          ]
        });

        console.log("Message sent:", info.messageId);
        return info;
      }

      await step.run("send-email", async () => {
        console.log(`Attempting to send email to: ${user?.email || passedEmail}`);
        const result = await sendTicket();
        console.log("Email sending result:", result);
        return result;
      });

      return { success: true };
    } catch (err: any) {
      console.error("Failed to send ticket email:", err);
      return { success: false, error: err.message };
    }
  },
);

const testEmailFunction = inngest.createFunction(
  { id: "test-email-function" },
  { event: "test/send-email" },
  async ({ event }) => {


  }
);



const clearSelectedSeats = inngest.createFunction(
  { id: "clear-seats" },
  { event: "booking/clear-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const { id, userId } = event.data;

      const result = await db
        .update(showSeats)
        .set({
          status: "AVAILABLE",
          booked_by: null,
        })
        .where(
          and(
            eq(showSeats.showId, Number(id)),
            eq(showSeats.booked_by, userId),
            ne(showSeats.status, "BOOKED"),
          ),
        )
        .execute();

      return { success: true, updated: result.rowCount };
    } catch (err: any) {
      console.error("Failed to mark seats as inactive:", err);
      return { success: false, error: err.message };
    }
  },
);

const syncUser = inngest.createFunction(
  { id: 'sync-user-from-clerk' }, // ←The 'id' is an arbitrary string used to identify the function in the dashboard
  { event: 'clerk/user.created' }, // ← This is the function's triggering event
  async ({ event }) => {
    const db = connectDb();
    const user = event.data // The event payload's data will be the Clerk User json object
    const { id, first_name, last_name } = user
    const email = user.email_addresses.find(
      (e: any) => e.id === user.primary_email_address_id,
    ).email_address
    await db.insert(users).values({
      clerkId: id,
      name: `${first_name} ${last_name}`,
      email: email,
      points: 0,
      role: 'USER',
    }).returning();
  },
)

const syncDeleteUser = inngest.createFunction(
  { id: 'delete-user-from-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    const db = connectDb();
    const user = event.data
    const { id } = user
    await db.delete(users).where(eq(users.clerkId, id)).returning();
  }
);
const approveReservedSeats = inngest.createFunction(
  { id: "approve-reserved-seats" },
  { event: "booking/approve-reserved-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const { seatId } = event.data;

      const result = await db
        .update(showSeats)
        .set({
          status: "BOOKED",
        })
        .where(eq(showSeats.id, seatId))
        .execute();

      return { success: true, updated: result.rowCount };
    } catch (err: any) {
      console.error("Failed to approve reserved seat:", err);
      return { success: false, error: err.message };
    }
  },
);

const rejectReservedSeats = inngest.createFunction(
  { id: "reject-reserved-seats" },
  { event: "booking/reject-reserved-seats" },
  async ({ event }) => {
    try {
      const db = connectDb();
      const { seatId } = event.data;

      // Get the seat to find showId
      const seat = await db
        .select()
        .from(showSeats)
        .where(eq(showSeats.id, seatId))
        .then((res: any) => res[0]);

      if (!seat) return { success: false, error: "Seat not found" };

      const result = await db
        .update(showSeats)
        .set({
          status: "AVAILABLE",
          booked_by: null,
          bookedTime: null,
        })
        .where(eq(showSeats.id, seatId))
        .execute();

      // Decrement reservedSeats in shows table
      const show = await db
        .select()
        .from(shows)
        .where(eq(shows.id, seat.showId))
        .then((res: any) => res[0]);

      if (show && show.reservedSeats > 0) {
        await db
          .update(shows)
          .set({
            reservedSeats: show.reservedSeats - 1,
          })
          .where(eq(shows.id, seat.showId))
          .execute();
      }

      return { success: true, updated: result.rowCount };
    } catch (err: any) {
      console.error("Failed to reject reserved seat:", err);
      return { success: false, error: err.message };
    }
  },
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
  helloWorld,
  showSeat,
  inActiveSeats,
  clearSelectedSeats,
  bookSeats,
  sendTicketEmail, // ← FIXED
  syncUser,
  syncDeleteUser,
  testEmailFunction,
  reserve_seats,
  approveReservedSeats,
  rejectReservedSeats,
];
