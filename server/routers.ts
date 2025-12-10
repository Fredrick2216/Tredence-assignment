import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createShow,
  getAllShows,
  getActiveShows,
  getShowById,
  getShowWithSeats,
  bookSeatsWithLocking,
  expirePendingBookings,
  getUserBookings,
  getBookingById,
  getShowBookings,
} from "./db";

// Admin procedure - requires admin role
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== SHOW MANAGEMENT ====================
  shows: router({
    // Admin: Create a new show/trip/slot
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required").max(255),
        description: z.string().optional(),
        startTime: z.string().transform(s => new Date(s)),
        totalSeats: z.number().int().min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const showId = await createShow({
          name: input.name,
          description: input.description || null,
          startTime: input.startTime,
          totalSeats: input.totalSeats,
          isActive: true,
          createdBy: ctx.user.id,
        });
        return { success: true, showId };
      }),

    // Admin: Get all shows (including inactive)
    listAll: adminProcedure.query(async () => {
      return getAllShows();
    }),

    // Admin: Get bookings for a specific show
    getBookings: adminProcedure
      .input(z.object({ showId: z.number() }))
      .query(async ({ input }) => {
        return getShowBookings(input.showId);
      }),

    // Public: Get active shows for users
    listActive: publicProcedure.query(async () => {
      // Expire pending bookings on each request (simple approach)
      await expirePendingBookings();
      return getActiveShows();
    }),

    // Public: Get show details with seat availability
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getShowById(input.id);
      }),

    // Public: Get show with all seats for booking page
    getWithSeats: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // Expire pending bookings first
        await expirePendingBookings();
        return getShowWithSeats(input.id);
      }),
  }),

  // ==================== BOOKING MANAGEMENT ====================
  bookings: router({
    // User: Book seats for a show
    create: protectedProcedure
      .input(z.object({
        showId: z.number(),
        seatIds: z.array(z.number()).min(1, "Select at least one seat").max(10, "Maximum 10 seats per booking"),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await bookSeatsWithLocking(
          input.showId,
          ctx.user.id,
          input.seatIds
        );

        if (!result.success) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: result.error || 'Booking failed',
          });
        }

        return {
          success: true,
          bookingId: result.bookingId,
          message: 'Booking confirmed successfully!',
        };
      }),

    // User: Get their bookings
    myBookings: protectedProcedure.query(async ({ ctx }) => {
      return getUserBookings(ctx.user.id);
    }),

    // User: Get specific booking details
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingById(input.id);
        
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }

        // Users can only view their own bookings (admins can view all)
        if (booking.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        return booking;
      }),

    // Admin: Manually expire pending bookings
    expirePending: adminProcedure.mutation(async () => {
      const count = await expirePendingBookings();
      return { success: true, expiredCount: count };
    }),
  }),
});

export type AppRouter = typeof appRouter;
