import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, Users, Plus, ArrowLeft, Ticket, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [totalSeats, setTotalSeats] = useState(40);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: shows, isLoading, refetch } = trpc.shows.listAll.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const createMutation = trpc.shows.create.useMutation({
    onSuccess: () => {
      toast.success("Show created successfully!");
      setShowForm(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create show");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartTime("");
    setTotalSeats(40);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) errors.name = "Name is required";
    if (!startTime) errors.startTime = "Start time is required";
    else {
      const selectedDate = new Date(startTime);
      if (selectedDate <= new Date()) {
        errors.startTime = "Start time must be in the future";
      }
    }
    if (totalSeats < 1) errors.totalSeats = "At least 1 seat required";
    if (totalSeats > 500) errors.totalSeats = "Maximum 500 seats allowed";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      startTime,
      totalSeats,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
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
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Please sign in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = getLoginUrl()}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage shows, trips, and slots</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Show
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Create Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Show/Trip/Slot</CardTitle>
              <CardDescription>Fill in the details to create a new bookable event</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Morning Bus to NYC, Movie Night, Dr. Smith Appointment"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={formErrors.name ? "border-destructive" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-destructive">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={formErrors.startTime ? "border-destructive" : ""}
                    />
                    {formErrors.startTime && (
                      <p className="text-sm text-destructive">{formErrors.startTime}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add details about this show, trip, or appointment slot..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="totalSeats">Total Seats *</Label>
                  <Input
                    id="totalSeats"
                    type="number"
                    min={1}
                    max={500}
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(parseInt(e.target.value) || 0)}
                    className={formErrors.totalSeats ? "border-destructive" : ""}
                  />
                  {formErrors.totalSeats && (
                    <p className="text-sm text-destructive">{formErrors.totalSeats}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Seats will be organized in rows of 10 (A1-A10, B1-B10, etc.)
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Show"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Shows List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            All Shows/Trips/Slots
          </h2>
          
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : !shows || shows.length === 0 ? (
            <Card className="p-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No shows yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first show, trip, or appointment slot to get started
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Show
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shows.map((show) => {
                const isPast = new Date(show.startTime) < new Date();
                const availabilityPercent = Math.round((show.availableSeats / show.totalSeats) * 100);
                
                return (
                  <Card key={show.id} className={isPast ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-1">{show.name}</CardTitle>
                        <Badge variant={show.isActive && !isPast ? "default" : "secondary"}>
                          {isPast ? "Past" : show.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {show.description && (
                        <CardDescription className="line-clamp-2">
                          {show.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(show.startTime), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(show.startTime), "h:mm a")}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className={availabilityPercent < 20 ? "text-destructive font-medium" : ""}>
                          {show.availableSeats} / {show.totalSeats} seats available
                        </span>
                      </div>
                      
                      {/* Availability bar */}
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            availabilityPercent > 50 ? "bg-green-500" :
                            availabilityPercent > 20 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${availabilityPercent}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
