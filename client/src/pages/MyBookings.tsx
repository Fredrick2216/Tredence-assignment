import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { Calendar, Clock, ArrowLeft, Ticket, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { Link } from "wouter";

const statusConfig = {
  PENDING: {
    icon: Clock3,
    label: "Pending",
    variant: "secondary" as const,
    className: "bg-yellow-100 text-yellow-700",
  },
  CONFIRMED: {
    icon: CheckCircle2,
    label: "Confirmed",
    variant: "default" as const,
    className: "bg-green-100 text-green-700",
  },
  FAILED: {
    icon: XCircle,
    label: "Failed",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-700",
  },
};

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();

  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
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
            <CardDescription>Please sign in to view your bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => window.location.href = getLoginUrl()}>
              Sign In
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shows
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-sm text-muted-foreground">View and manage your booking history</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't made any bookings yet. Browse available shows to get started.
            </p>
            <Link href="/">
              <Button>Browse Shows</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const status = statusConfig[booking.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              const isPast = booking.show && new Date(booking.show.startTime) < new Date();
              
              return (
                <Card key={booking.id} className={isPast ? "opacity-70" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {booking.show?.name || "Unknown Show"}
                        </CardTitle>
                        <CardDescription>
                          Booking #{booking.id} • {format(new Date(booking.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </CardDescription>
                      </div>
                      <Badge className={status.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {booking.show && (
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(booking.show.startTime), "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(booking.show.startTime), "h:mm a")}</span>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Booked Seats ({booking.totalSeats})</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.seats && booking.seats.length > 0 ? (
                          booking.seats
                            .sort((a, b) => a.row.localeCompare(b.row) || a.seatNumber - b.seatNumber)
                            .map((seat) => (
                              <Badge key={seat.id} variant="outline">
                                {seat.row}{seat.seatNumber}
                              </Badge>
                            ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {booking.totalSeats} seat{booking.totalSeats !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {booking.status === 'FAILED' && booking.failureReason && (
                      <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                        <strong>Reason:</strong> {booking.failureReason}
                      </div>
                    )}

                    {booking.status === 'CONFIRMED' && booking.confirmedAt && (
                      <p className="text-xs text-muted-foreground">
                        Confirmed on {format(new Date(booking.confirmedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
