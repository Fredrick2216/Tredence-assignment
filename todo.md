# Ticket Booking System - TODO

## Database & Schema
- [x] Shows/trips/slots table with name, start time, total seats
- [x] Seats table for individual seat tracking
- [x] Bookings table with status (PENDING, CONFIRMED, FAILED)
- [x] Push database migrations

## Backend APIs
- [x] Admin: Create show/trip/slot endpoint
- [x] Admin: List all shows/trips/slots endpoint
- [x] User: Get available shows/trips/slots endpoint
- [x] User: Get show details with seat availability
- [x] User: Book seats with transaction-based locking
- [x] User: Get booking status endpoint
- [x] Concurrency control with row-level locking
- [x] Booking expiry mechanism (2-minute timeout for PENDING)

## Admin Dashboard
- [x] Create show/trip/slot form with validation
- [x] List all shows/trips/slots view
- [x] View bookings for each show

## User Interface
- [x] Browse available shows/trips/slots page
- [x] Visual seat selection grid
- [x] Real-time booking status display
- [x] Error handling for booking conflicts
- [x] Loading and empty states

## State Management
- [x] React Context for shows data
- [x] React Context for booking state
- [x] Efficient API calls with caching

## Routing
- [x] / - List of shows for users
- [x] /admin - Admin dashboard
- [x] /booking/:id - Booking page with seat selection

## Documentation
- [x] README.md with setup instructions
- [x] API documentation
- [x] System design write-up
- [x] Architecture diagram
