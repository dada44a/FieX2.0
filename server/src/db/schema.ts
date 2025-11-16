import { is } from "drizzle-orm"
import {
    pgTable,
    serial,
    varchar,
    text,
    integer,
    boolean,
    date,
    time,
} from "drizzle-orm/pg-core"

// ------------------ USERS ------------------
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    role: varchar("role", { length: 100 }).notNull(),
    points: integer("points").default(0),
    clerkId: varchar("clerkid", { length: 255 }),
})

// ------------------ MOVIE ------------------
export const movies = pgTable("movies", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    genre: varchar("genre", { length: 100 }).notNull(),
    casts: text("casts").notNull(),
    releaseDate: date("release_date").notNull(),
    imageLink: varchar("image_link", { length: 255 }).notNull(),
})

// ------------------ SCREEN ------------------
export const screens = pgTable("screens", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    price: integer("price").notNull(),
})

// ------------------ SEAT ------------------
export const seats = pgTable("seats", {
    id: serial("id").primaryKey(),
    row: varchar("rows", { length: 10 }).notNull(),
    column: integer("columns").notNull(),
    isBooked: boolean("is_booked").default(false).notNull(),
    screenId: integer("screen_id")
        .notNull()
        .references(() => screens.id, { onDelete: "cascade" }),
})

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
})

// ------------------ TICKET ------------------
export const tickets = pgTable("tickets", {
    id: serial("id").primaryKey(),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    customerId: integer("customer_id")
        .references(() => users.id, { onDelete: "set null" }),
    showId: integer("show_id")
        .references(() => shows.id, { onDelete: "cascade" }),
})

// ------------------ TICKET_SEAT ------------------
export const ticketSeats = pgTable("ticket_seats", {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
        .notNull()
        .references(() => tickets.id, { onDelete: "cascade" }),
    seatId: integer("seat_id")
        .notNull()
        .references(() => seats.id, { onDelete: "cascade" }),
})

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
    isBooked: boolean("is_booked").default(false).notNull(),

})