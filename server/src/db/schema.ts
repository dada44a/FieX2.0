import { is } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  date,
  time,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

const seatStatus = pgEnum("seat_status", ["AVAILABLE", "SELECTED", "BOOKED", "RESERVED"]);
// ------------------ USERS ------------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 100 }).notNull(),
  points: integer("points").default(0),
  clerkId: varchar("clerkid", { length: 255 }),
});

// ------------------ MOVIE ------------------
export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  genre: varchar("genre", { length: 100 }).notNull(),
  casts: text("casts").notNull(),
  releaseDate: date("release_date").notNull(),
  imageLink: varchar("image_link", { length: 255 }).notNull(),
});

// ------------------ SCREEN ------------------
export const screens = pgTable("screens", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  price: integer("price").notNull(),
});

// ------------------ SEAT ------------------
export const seats = pgTable("seats", {
  id: serial("id").primaryKey(),
  row: varchar("rows", { length: 10 }).notNull(),
  column: integer("columns").notNull(),
  isBooked: boolean("is_booked").default(false).notNull(),
  screenId: integer("screen_id")
    .notNull()
    .references(() => screens.id, { onDelete: "cascade" }),
});

// ------------------ SHOW ------------------
export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  showTime: time("show_time").notNull(),
  showDate: date("show_date").notNull(),
  screenId: integer("screen_id")
    .notNull()
    .references(() => screens.id, { onDelete: "cascade" }),
  reservedSeats: integer("reserved_seats").default(0).notNull(),
});

// ------------------ TICKET ------------------
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  customerId: text("customerId").notNull(),
  pidx: text("pidx").notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  transactionId: text("transactionId").notNull(),
  showId: integer("show_id").references(() => shows.id, {
    onDelete: "cascade",
  }),
  bookedTime: text("booked_time"),
  isUsed: boolean("is_used").default(false).notNull(),
});

export const showSeats = pgTable("show_seats", {
  id: serial("id").primaryKey(),
  showId: integer("show_id")
    .notNull()
    .references(() => shows.id, { onDelete: "cascade" }),
  screenId: integer("screen_id")
    .notNull()
    .references(() => screens.id, { onDelete: "cascade" }),
  row: varchar("rows", { length: 10 }).notNull(),
  column: integer("columns").notNull(),
  status: varchar("status", { length: 20 }).default("AVAILABLE").notNull(),
  booked_by: varchar("booked_by", { length: 255 }),
  ticketId: integer("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  bookedTime: text("booked_time"),
});

// ------------------ MOVIE REQUEST ------------------
export const movieRequests = pgTable("movie_requests", {
  id: serial("id").primaryKey(),
  movieTitle: varchar("movie_title", { length: 255 }).notNull(),
  description: text("description"),
  userId: text("user_id"),
  status: varchar("status", { length: 20 }).default('PENDING').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
