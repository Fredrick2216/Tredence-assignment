import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, Users, ArrowLeft, Monitor, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SelectedSeat {
  id: number;
  row: string;
  seatNumber: number;
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const showId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  
  const { user, loading: authLoading } = useAuth();
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const seatGridRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = trpc.shows.getWithSeats.useQuery(
    { id: showId },
    { enabled: showId > 0 }
  );

  const bookMutation = trpc.bookings.create.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setSelectedSeats([]);
      refetch();
      // Navigate to bookings page after short delay
      setTimeout(() => setLocation('/my-bookings'), 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Booking failed. Please try again.");
      refetch(); // Refresh seat availability
    },
  });

  // Cleanup selected seats on unmount
  useEffect(() => {
    return () => {
      setSelectedSeats([]);
    };
  }, []);

  const toggleSeat = useCallback((seat: { id: number; row: string; seatNumber: number; isBooked: boolean }) => {
    if (seat.isBooked) return;
    
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id);
      if (exists) {
        // Direct DOM update for immediate feedback
        const seatEl = document.getElementById(`seat-${seat.id}`);
        if (seatEl) {
          seatEl.classList.remove('bg-primary', 'text-primary-foreground', 'ring-2', 'ring-primary');
          seatEl.classList.add('bg-green-100', 'text-green-700', 'hover:bg-green-200');
        }
        return prev.filter(s => s.id !== seat.id);
      }
      if (prev.length >= 10) {
        toast.error("Maximum 10 seats per booking");
        return prev;
      }
      // Direct DOM update for immediate feedback
      const seatEl = document.getElementById(`seat-${seat.id}`);
      if (seatEl) {
        seatEl.classList.remove('bg-green-100', 'text-green-700', 'hover:bg-green-200');
        seatEl.classList.add('bg-primary', 'text-primary-foreground', 'ring-2', 'ring-primary');
      }
      return [...prev, { id: seat.id, row: seat.row, seatNumber: seat.seatNumber }];
    });
  }, []);

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmBooking = () => {
    setShowConfirmDialog(false);
    bookMutation.mutate({
      showId,
      seatIds: selectedSeats.map(s => s.id),
    });
  };

  const isSelected = (seatId: number) => selectedSeats.some(s => s.id === seatId);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to book seats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => window.location.href = getLoginUrl()}>
              Sign In to Continue
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shows
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.show) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Show Not Found</CardTitle>
            <CardDescription>This show may have been removed or is no longer available</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shows
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { show, seats } = data;
  const isPast = new Date(show.startTime) < new Date();

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, typeof seats>);

  const sortedRows = Object.keys(seatsByRow).sort();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shows
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{show.name}</h1>
              {show.description && (
                <p className="text-sm text-muted-foreground mt-1">{show.description}</p>
              )}
            </div>
            <Badge variant={isPast ? "destructive" : "secondary"} className="w-fit">
              {isPast ? "Past Event" : `${show.availableSeats} seats left`}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Show Details */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span>{format(new Date(show.startTime), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>{format(new Date(show.startTime), "h:mm a")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{show.availableSeats} / {show.totalSeats} available</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPast ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">This event has passed</h3>
            <p className="text-muted-foreground">Booking is no longer available for past events</p>
          </Card>
        ) : (
          <>
            {/* Seat Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Select Your Seats
                </CardTitle>
                <CardDescription>
                  Click on available seats to select them. Maximum 10 seats per booking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-100 border border-green-300" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted" />
                    <span>Booked</span>
                  </div>
                </div>

                {/* Screen indicator */}
                <div className="mb-8">
                  <div className="w-3/4 mx-auto h-2 bg-gradient-to-b from-muted-foreground/30 to-transparent rounded-t-full" />
                  <p className="text-center text-xs text-muted-foreground mt-1">SCREEN / STAGE</p>
                </div>

                {/* Seat Grid */}
                <div ref={seatGridRef} className="space-y-3 overflow-x-auto pb-4">
                  {sortedRows.map(row => (
                    <div key={row} className="flex items-center gap-2 min-w-fit">
                      <span className="w-8 text-sm font-medium text-muted-foreground">{row}</span>
                      <div className="flex gap-2">
                        {seatsByRow[row]
                          .sort((a, b) => a.seatNumber - b.seatNumber)
                          .map(seat => {
                            const selected = isSelected(seat.id);
                            return (
                              <button
                                key={seat.id}
                                id={`seat-${seat.id}`}
                                onClick={() => toggleSeat(seat)}
                                disabled={seat.isBooked || bookMutation.isPending}
                                className={`
                                  w-9 h-9 rounded text-xs font-medium transition-all
                                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                                  ${seat.isBooked 
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                                    : selected
                                      ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                                  }
                                `}
                                title={seat.isBooked ? 'Already booked' : `Row ${seat.row}, Seat ${seat.seatNumber}`}
                              >
                                {seat.seatNumber}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="sticky bottom-4 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Selected Seats</p>
                    {selectedSeats.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats
                          .sort((a, b) => a.row.localeCompare(b.row) || a.seatNumber - b.seatNumber)
                          .map(seat => (
                            <Badge key={seat.id} variant="secondary">
                              {seat.row}{seat.seatNumber}
                            </Badge>
                          ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No seats selected</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">
                      {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
                    </span>
                    <Button 
                      size="lg"
                      onClick={handleBooking}
                      disabled={selectedSeats.length === 0 || bookMutation.isPending}
                    >
                      {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Booking</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>You are about to book the following seats:</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-medium">{show.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(show.startTime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedSeats
                      .sort((a, b) => a.row.localeCompare(b.row) || a.seatNumber - b.seatNumber)
                      .map(seat => (
                        <Badge key={seat.id}>{seat.row}{seat.seatNumber}</Badge>
                      ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. Your booking will be confirmed immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBooking}>
              Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
