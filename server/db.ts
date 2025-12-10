import { eq, and, sql, gt, lt, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, shows, seats, bookings, bookedSeats, InsertShow, InsertSeat, InsertBooking, InsertBookedSeat } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// Get database pool for transactions
export async function getPool() {
  if (!_pool && process.env.DATABASE_URL) {
    _pool = mysql.createPool(process.env.DATABASE_URL);
  }
  return _pool;
}

// Lazily create the drizzle instance
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER OPERATIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== SHOW OPERATIONS ====================

export async function createShow(show: Omit<InsertShow, 'availableSeats'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(shows).values({
    ...show,
    availableSeats: show.totalSeats,
  });

  const showId = Number(result[0].insertId);

  // Create seats for the show (organized in rows)
  const seatsPerRow = 10;
  const totalRows = Math.ceil(show.totalSeats / seatsPerRow);
  const seatRecords: InsertSeat[] = [];

  for (let row = 0; row < totalRows; row++) {
    const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
    const seatsInThisRow = Math.min(seatsPerRow, show.totalSeats - row * seatsPerRow);
    
    for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
      seatRecords.push({
        showId,
        seatNumber: seatNum,
        row: rowLetter,
        isBooked: false,
        version: 0,
      });
    }
  }

  if (seatRecords.length > 0) {
    await db.insert(seats).values(seatRecords);
  }

  return showId;
}

export async function getAllShows() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(shows).orderBy(desc(shows.createdAt));
}

export async function getActiveShows() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(shows)
    .where(and(
      eq(shows.isActive, true),
      gt(shows.startTime, new Date())
    ))
    .orderBy(asc(shows.startTime));
}

export async function getShowById(showId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(shows).where(eq(shows.id, showId)).limit(1);
  return result[0] || null;
}

export async function getShowWithSeats(showId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const show = await getShowById(showId);
  if (!show) return null;

  const showSeats = await db.select().from(seats)
    .where(eq(seats.showId, showId))
    .orderBy(asc(seats.row), asc(seats.seatNumber));

  return { show, seats: showSeats };
}

// ==================== BOOKING OPERATIONS ====================

/**
 * Book seats with transaction-based row-level locking to prevent race conditions
 * Uses SELECT ... FOR UPDATE to lock rows during the transaction
 */
export async function bookSeatsWithLocking(
  showId: number,
  userId: number,
  seatIds: number[]
): Promise<{ success: boolean; bookingId?: number; error?: string }> {
  const pool = await getPool();
  if (!pool) throw new Error("Database pool not available");

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Lock the show row to prevent concurrent modifications
    const [showRows] = await connection.execute(
      'SELECT id, availableSeats, isActive FROM shows WHERE id = ? FOR UPDATE',
      [showId]
    ) as any;

    if (!showRows || showRows.length === 0) {
      await connection.rollback();
      return { success: false, error: 'Show not found' };
    }

    const show = showRows[0];
    if (!show.isActive) {
      await connection.rollback();
      return { success: false, error: 'Show is no longer active' };
    }

    if (show.availableSeats < seatIds.length) {
      await connection.rollback();
      return { success: false, error: 'Not enough seats available' };
    }

    // 2. Lock the specific seats with FOR UPDATE
    const placeholders = seatIds.map(() => '?').join(',');
    const [seatRows] = await connection.execute(
      `SELECT id, isBooked, version FROM seats WHERE id IN (${placeholders}) AND showId = ? FOR UPDATE`,
      [...seatIds, showId]
    ) as any;

    if (!seatRows || seatRows.length !== seatIds.length) {
      await connection.rollback();
      return { success: false, error: 'Some seats not found' };
    }

    // 3. Check if any seats are already booked
    const alreadyBooked = seatRows.filter((s: any) => s.isBooked);
    if (alreadyBooked.length > 0) {
      await connection.rollback();
      return { success: false, error: 'Some seats are already booked' };
    }

    // 4. Create booking record with PENDING status and expiry time (2 minutes)
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (showId, userId, status, totalSeats, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [showId, userId, 'PENDING', seatIds.length, expiresAt]
    ) as any;

    const bookingId = bookingResult.insertId;

    // 5. Mark seats as booked with optimistic locking (increment version)
    for (const seatId of seatIds) {
      await connection.execute(
        'UPDATE seats SET isBooked = true, version = version + 1, updatedAt = NOW() WHERE id = ?',
        [seatId]
      );

      // 6. Create booked_seats junction records
      await connection.execute(
        'INSERT INTO bookedSeats (bookingId, seatId, createdAt) VALUES (?, ?, NOW())',
        [bookingId, seatId]
      );
    }

    // 7. Update available seats count on the show
    await connection.execute(
      'UPDATE shows SET availableSeats = availableSeats - ?, updatedAt = NOW() WHERE id = ?',
      [seatIds.length, showId]
    );

    // 8. Confirm the booking immediately (in real system, this might wait for payment)
    await connection.execute(
      'UPDATE bookings SET status = ?, confirmedAt = NOW(), updatedAt = NOW() WHERE id = ?',
      ['CONFIRMED', bookingId]
    );

    await connection.commit();
    return { success: true, bookingId };

  } catch (error: any) {
    await connection.rollback();
    console.error('[Booking] Transaction failed:', error);
    return { success: false, error: error.message || 'Booking failed' };
  } finally {
    connection.release();
  }
}

/**
 * Expire pending bookings that have exceeded the 2-minute timeout
 * This should be called periodically (e.g., via cron job or on each request)
 */
export async function expirePendingBookings(): Promise<number> {
  const pool = await getPool();
  if (!pool) throw new Error("Database pool not available");

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Find expired PENDING bookings
    const [expiredBookings] = await connection.execute(
      'SELECT id, showId, totalSeats FROM bookings WHERE status = ? AND expiresAt < NOW() FOR UPDATE',
      ['PENDING']
    ) as any;

    if (!expiredBookings || expiredBookings.length === 0) {
      await connection.commit();
      return 0;
    }

    for (const booking of expiredBookings) {
      // Get the booked seats for this booking
      const [bookedSeatRows] = await connection.execute(
        'SELECT seatId FROM bookedSeats WHERE bookingId = ?',
        [booking.id]
      ) as any;

      // Release the seats
      for (const row of bookedSeatRows) {
        await connection.execute(
          'UPDATE seats SET isBooked = false, version = version + 1, updatedAt = NOW() WHERE id = ?',
          [row.seatId]
        );
      }

      // Update show available seats
      await connection.execute(
        'UPDATE shows SET availableSeats = availableSeats + ?, updatedAt = NOW() WHERE id = ?',
        [booking.totalSeats, booking.showId]
      );

      // Mark booking as FAILED
      await connection.execute(
        'UPDATE bookings SET status = ?, failureReason = ?, updatedAt = NOW() WHERE id = ?',
        ['FAILED', 'Booking expired after 2 minutes', booking.id]
      );
    }

    await connection.commit();
    return expiredBookings.length;

  } catch (error) {
    await connection.rollback();
    console.error('[Booking] Failed to expire bookings:', error);
    return 0;
  } finally {
    connection.release();
  }
}

export async function getUserBookings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userBookings = await db.select().from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));

  // Get show details and booked seats for each booking
  const result = [];
  for (const booking of userBookings) {
    const show = await getShowById(booking.showId);
    const bookedSeatRecords = await db.select().from(bookedSeats)
      .where(eq(bookedSeats.bookingId, booking.id));
    
    const seatDetails = [];
    for (const bs of bookedSeatRecords) {
      const seat = await db.select().from(seats).where(eq(seats.id, bs.seatId)).limit(1);
      if (seat[0]) seatDetails.push(seat[0]);
    }

    result.push({
      ...booking,
      show,
      seats: seatDetails,
    });
  }

  return result;
}

export async function getBookingById(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!result[0]) return null;

  const booking = result[0];
  const show = await getShowById(booking.showId);
  const bookedSeatRecords = await db.select().from(bookedSeats)
    .where(eq(bookedSeats.bookingId, bookingId));
  
  const seatDetails = [];
  for (const bs of bookedSeatRecords) {
    const seat = await db.select().from(seats).where(eq(seats.id, bs.seatId)).limit(1);
    if (seat[0]) seatDetails.push(seat[0]);
  }

  return {
    ...booking,
    show,
    seats: seatDetails,
  };
}

export async function getShowBookings(showId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select({
    booking: bookings,
    user: users,
  })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.showId, showId))
    .orderBy(desc(bookings.createdAt));
}
