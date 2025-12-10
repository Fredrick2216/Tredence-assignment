import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb, getPool } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(userId: number = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Shows API", () => {
  it("admin can create a show", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const result = await caller.shows.create({
      name: "Test Show",
      description: "A test show for vitest",
      startTime: futureDate.toISOString(),
      totalSeats: 20,
    });

    expect(result.success).toBe(true);
    expect(result.showId).toBeGreaterThan(0);
  });

  it("regular user cannot create a show", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    await expect(
      caller.shows.create({
        name: "Unauthorized Show",
        startTime: futureDate.toISOString(),
        totalSeats: 10,
      })
    ).rejects.toThrow("Admin access required");
  });

  it("can list active shows", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const shows = await caller.shows.listActive();
    expect(Array.isArray(shows)).toBe(true);
  });

  it("can get show with seats", async () => {
    // First create a show as admin
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const createResult = await adminCaller.shows.create({
      name: "Show With Seats Test",
      startTime: futureDate.toISOString(),
      totalSeats: 20,
    });

    // Then get it as a user
    const userCtx = createUserContext();
    const userCaller = appRouter.createCaller(userCtx);

    const showData = await userCaller.shows.getWithSeats({ id: createResult.showId });

    expect(showData).not.toBeNull();
    expect(showData?.show.name).toBe("Show With Seats Test");
    expect(showData?.seats.length).toBe(20);
    expect(showData?.seats.every(s => !s.isBooked)).toBe(true);
  });
});

describe("Booking API", () => {
  let testShowId: number;
  let testSeatIds: number[];

  beforeAll(async () => {
    // Create a test show
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    const result = await adminCaller.shows.create({
      name: "Booking Test Show",
      startTime: futureDate.toISOString(),
      totalSeats: 40,
    });

    testShowId = result.showId;

    // Get seat IDs
    const userCtx = createUserContext();
    const userCaller = appRouter.createCaller(userCtx);
    const showData = await userCaller.shows.getWithSeats({ id: testShowId });
    testSeatIds = showData?.seats.map(s => s.id) || [];
  });

  it("user can book available seats", async () => {
    const ctx = createUserContext(10);
    const caller = appRouter.createCaller(ctx);

    const seatsToBook = testSeatIds.slice(0, 2);
    const result = await caller.bookings.create({
      showId: testShowId,
      seatIds: seatsToBook,
    });

    expect(result.success).toBe(true);
    expect(result.bookingId).toBeGreaterThan(0);
  });

  it("cannot book already booked seats", async () => {
    // First user books seats
    const ctx1 = createUserContext(11);
    const caller1 = appRouter.createCaller(ctx1);

    const seatsToBook = testSeatIds.slice(10, 12);
    await caller1.bookings.create({
      showId: testShowId,
      seatIds: seatsToBook,
    });

    // Second user tries to book same seats
    const ctx2 = createUserContext(12);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(
      caller2.bookings.create({
        showId: testShowId,
        seatIds: seatsToBook,
      })
    ).rejects.toThrow();
  });

  it("user can view their bookings", async () => {
    const ctx = createUserContext(10);
    const caller = appRouter.createCaller(ctx);

    const bookings = await caller.bookings.myBookings();
    expect(Array.isArray(bookings)).toBe(true);
    expect(bookings.length).toBeGreaterThan(0);
  });

  it("validates maximum seats per booking", async () => {
    const ctx = createUserContext(13);
    const caller = appRouter.createCaller(ctx);

    // Try to book more than 10 seats
    const tooManySeats = testSeatIds.slice(20, 35); // 15 seats

    await expect(
      caller.bookings.create({
        showId: testShowId,
        seatIds: tooManySeats,
      })
    ).rejects.toThrow();
  });

  it("validates at least one seat required", async () => {
    const ctx = createUserContext(14);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.create({
        showId: testShowId,
        seatIds: [],
      })
    ).rejects.toThrow();
  });
});

describe("Concurrency Control", () => {
  it("handles concurrent booking attempts correctly", async () => {
    // Create a show with limited seats
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 21);

    const result = await adminCaller.shows.create({
      name: "Concurrency Test Show",
      startTime: futureDate.toISOString(),
      totalSeats: 5,
    });

    const showId = result.showId;

    // Get seat IDs
    const userCtx = createUserContext();
    const userCaller = appRouter.createCaller(userCtx);
    const showData = await userCaller.shows.getWithSeats({ id: showId });
    const seatIds = showData?.seats.map(s => s.id) || [];

    // Simulate concurrent booking attempts for the same seat
    const targetSeat = [seatIds[0]];

    const user1Ctx = createUserContext(100);
    const user2Ctx = createUserContext(101);
    const user3Ctx = createUserContext(102);

    const caller1 = appRouter.createCaller(user1Ctx);
    const caller2 = appRouter.createCaller(user2Ctx);
    const caller3 = appRouter.createCaller(user3Ctx);

    // Launch concurrent booking attempts
    const results = await Promise.allSettled([
      caller1.bookings.create({ showId, seatIds: targetSeat }),
      caller2.bookings.create({ showId, seatIds: targetSeat }),
      caller3.bookings.create({ showId, seatIds: targetSeat }),
    ]);

    // Only one should succeed
    const successes = results.filter(r => r.status === "fulfilled");
    const failures = results.filter(r => r.status === "rejected");

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(2);
  });
});
