import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as Schema from "./db/schema.js";


export type Ticket = InferSelectModel<typeof Schema.tickets>;
export type NewTicket = InferInsertModel<typeof Schema.tickets>;

export type Show = InferSelectModel<typeof Schema.shows>;
export type NewShow = InferInsertModel<typeof Schema.shows>;

export type Movie = InferSelectModel<typeof Schema.movies>;
export type NewMovie = InferInsertModel<typeof Schema.movies>;

export type Screens = InferSelectModel<typeof Schema.screens>;
export type NewScreens = InferInsertModel<typeof Schema.screens>;

export type Seat = InferSelectModel<typeof Schema.seats>;
export type NewSeat = InferInsertModel<typeof Schema.seats>;

export type User = InferSelectModel<typeof Schema.users>;
export type NewUser = InferInsertModel<typeof Schema.users>;

