import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Shows/Trips/Slots table - represents bookable events
 */
export const shows = mysqlTable("shows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  totalSeats: int("totalSeats").notNull(),
  availableSeats: int("availableSeats").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Show = typeof shows.$inferSelect;
export type InsertShow = typeof shows.$inferInsert;

/**
 * Seats table - individual seats for each show
 */
export const seats = mysqlTable("seats", {
  id: int("id").autoincrement().primaryKey(),
  showId: int("showId").notNull(),
  seatNumber: int("seatNumber").notNull(),
  row: varchar("row", { length: 10 }).notNull(),
  isBooked: boolean("isBooked").default(false).notNull(),
  version: int("version").default(0).notNull(), // For optimistic locking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seat = typeof seats.$inferSelect;
export type InsertSeat = typeof seats.$inferInsert;

/**
 * Bookings table - tracks all booking attempts with status
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  showId: int("showId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["PENDING", "CONFIRMED", "FAILED"]).default("PENDING").notNull(),
  totalSeats: int("totalSeats").notNull(),
  failureReason: text("failureReason"),
  expiresAt: timestamp("expiresAt"), // For PENDING bookings, expires after 2 minutes
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * BookedSeats table - junction table linking bookings to specific seats
 */
export const bookedSeats = mysqlTable("bookedSeats", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  seatId: int("seatId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookedSeat = typeof bookedSeats.$inferSelect;
export type InsertBookedSeat = typeof bookedSeats.$inferInsert;
