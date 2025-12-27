import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { format } from "date-fns";
import { Loader2, Calendar as CalendarIcon, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookingCalendar from "@/components/admin/BookingCalendar";

// Add styles directly in the component file as CSS
const animations = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 100% 0; }
  }
  
  .pulse-animation {
    animation: pulse 2s infinite ease-in-out;
  }
  
  .shimmer-animation {
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
    background-size: 200% 100%;
    animation: shimmer 1s infinite;
  }
`;

export default function AdminDashboard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar"); // Set default to calendar view
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<{id: number, bookingType?: string} | null>(null);
  const [pendingCancellation, setPendingCancellation] = useState<{id: number, bookingType?: string} | null>(null);
  // Add state for auto-refresh interval
  const [refreshInterval, setRefreshInterval] = useState<number | false>(30000); // Default: refresh every 30 seconds
  // Add state to track new bookings
  const [previousBookingCount, setPreviousBookingCount] = useState<number>(0);
  const [newBookingsCount, setNewBookingsCount] = useState<number>(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  // Add sound notification toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    // Create audio element for notification sound
    notificationAudioRef.current = new Audio('/notification.mp3');
    
    // Check if there's a saved preference for sound
    const savedSoundPreference = localStorage.getItem('adminSoundNotifications');
    if (savedSoundPreference) {
      setSoundEnabled(savedSoundPreference === 'true');
    }
    
    // Clean up
    return () => {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current = null;
      }
    };
  }, []);

  // Save sound preference when changed
  useEffect(() => {
    localStorage.setItem('adminSoundNotifications', soundEnabled.toString());
  }, [soundEnabled]);

  // Check if admin is logged in
  useEffect(() => {
    const adminEmail = sessionStorage.getItem("adminEmail");
    if (!adminEmail) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access the admin dashboard",
        variant: "destructive",
      });
      // Use wouter navigation
      setLocation("/admin");
    }
  }, [setLocation, toast]);

  // Fetch all bookings
  const { data: bookings, isLoading, error, refetch, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      setIsRefreshing(true);
      try {
        const adminEmail = sessionStorage.getItem("adminEmail");
        
        if (!adminEmail) {
          console.error("No admin email found in session storage");
          toast({
            title: "Authentication error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          setLocation("/admin");
          throw new Error("Unauthorized: No admin email found");
        }
        
        console.log("Fetching bookings with admin email");
        const response = await apiRequest("GET", "/api/bookings", undefined, {
          headers: {
            "admin-email": adminEmail
          }
        });
        
        console.log("Bookings API response status:", response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error("Unauthorized: Admin email invalid");
            sessionStorage.removeItem("adminEmail");
            sessionStorage.removeItem("adminRole");
            setLocation("/admin");
            throw new Error("Unauthorized: Please log in again");
          }
          
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", errorData);
          throw new Error(errorData.message || "Failed to fetch bookings");
        }
        
        const data = await response.json();
        console.log(`Successfully fetched ${data.length} bookings`);
        setIsRefreshing(false);
        return data;
      } catch (error) {
        console.error("Error in booking fetch function:", error);
        setIsRefreshing(false);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: refreshInterval, // Add auto-refresh interval
    staleTime: 15000 // Consider data stale after 15 seconds
  });

  // Track new bookings
  useEffect(() => {
    if (bookings && previousBookingCount > 0) {
      // Count only pending or confirmed bookings (not completed/cancelled)
      const currentActiveBookings = bookings.filter((booking: any) => 
        booking.status === 'pending' || booking.status === 'confirmed'
      ).length;
      
      const newCount = Math.max(0, currentActiveBookings - previousBookingCount);
      
      if (newCount > 0) {
        // Show notification
        toast({
          title: `${newCount} New Booking${newCount > 1 ? 's' : ''}`,
          description: "New bookings have been added to the dashboard",
        });
        
        // Play notification sound if enabled
        if (soundEnabled && notificationAudioRef.current) {
          try {
            notificationAudioRef.current.currentTime = 0;
            notificationAudioRef.current.play().catch(err => {
              console.error("Failed to play notification sound:", err);
            });
          } catch (error) {
            console.error("Error playing notification sound:", error);
          }
        }
        
        // Update the count
        setNewBookingsCount(newCount);
      }
      
      // Update the last refresh time
      setLastRefreshTime(new Date(dataUpdatedAt));
    }
    
    // Always update the previous count for next comparison
    if (bookings) {
      const activeBookingsCount = bookings.filter((booking: any) => 
        booking.status === 'pending' || booking.status === 'confirmed'
      ).length;
      
      setPreviousBookingCount(activeBookingsCount);
    }
  }, [bookings, dataUpdatedAt]);
  
  // Reset new bookings count when changing tabs or filters
  useEffect(() => {
    setNewBookingsCount(0);
  }, [activeTab, filter]);

  // Add search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter bookings based on active tab, status filter, and search query
  const filteredBookings = bookings ? bookings.filter((booking: any) => {
    // Filter by service type tab
    if (activeTab === "all") {
      // Show all except daycare if it doesn't exist
      if (booking.serviceType === "daycare") return false;
    } else if (activeTab === "grooming") {
      if (booking.serviceType !== "grooming") return false;
    } else if (activeTab === "hotel") {
      if (booking.serviceType !== "hotel") return false;
    } else {
      return false;
    }
    
    // Filter by status
    if (filter !== "all" && booking.status !== filter) {
      return false;
    }
    
    // Filter by search query (searches in pet name, customer name, email, phone)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesPetName = booking.petName?.toLowerCase().includes(query);
      const matchesCustomerName = booking.customerName?.toLowerCase().includes(query);
      const matchesEmail = booking.customerEmail?.toLowerCase().includes(query);
      const matchesPhone = booking.customerPhone?.includes(query);
      const matchesBreed = booking.petBreed?.toLowerCase().includes(query);
      
      if (!matchesPetName && !matchesCustomerName && !matchesEmail && !matchesPhone && !matchesBreed) {
        return false;
      }
    }
    
    return true;
  }) : [];

  const handleLogout = () => {
    sessionStorage.removeItem("adminEmail");
    sessionStorage.removeItem("adminRole");
    // Use wouter navigation
    setLocation("/admin");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  // Handle booking status change - with confirmation for completed or cancelled status
  const handleStatusChange = async (bookingId: number, newStatus: string, bookingType?: string) => {
    // If marking as completed, show completion confirmation dialog
    if (newStatus === "completed") {
      setPendingCompletion({ id: bookingId, bookingType });
      setShowCompletionDialog(true);
      return;
    }
    
    // If marking as cancelled, show cancellation confirmation dialog
    if (newStatus === "cancelled") {
      setPendingCancellation({ id: bookingId, bookingType });
      setShowCancellationDialog(true);
      return;
    }
    
    // Otherwise proceed directly with the status change (for pending/confirmed)
    await updateBookingStatus(bookingId, newStatus, bookingType);
  };
  
  // Function to actually perform the status update
  const updateBookingStatus = async (bookingId: number, newStatus: string, bookingType?: string) => {
    try {
      console.log(`Updating booking #${bookingId} to status: ${newStatus}, type: ${bookingType || 'unknown'}`);
      
      const adminEmail = sessionStorage.getItem("adminEmail");
      
      // Debug logging for the exact data being sent
      const requestData = { 
        status: newStatus,
        bookingType: bookingType // Send the booking type if available
      };
      console.log("Request payload:", JSON.stringify(requestData));
      
      // Use direct fetch to bypass any middleware issues
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'admin-email': adminEmail || ''
        },
        body: JSON.stringify(requestData)
      });
      
      // Log full response details
      console.log(`Status update response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        
        // Try to get detailed error message from response
        const errorData = await response.json().catch(() => null);
        console.error("Error details:", errorData);
        
        throw new Error(
          errorData?.message || 
          `Failed to update booking status (${response.status})`
        );
      }
      
      // Parse the response data
      const responseData = await response.json();
      
      console.log("Status update successful:", responseData);
      
      // Special message if the booking was deleted (when marked as completed or cancelled)
      if ((newStatus === "completed" || newStatus === "cancelled") && responseData.wasDeleted) {
        toast({
          title: newStatus === "completed" ? "Booking completed" : "Booking cancelled",
          description: `Booking has been marked as ${newStatus} and removed from the database`,
        });
      } else {
        toast({
          title: "Status updated",
          description: `Booking status updated to ${newStatus}`,
        });
      }
      
      // Refetch bookings to update the list
      refetch();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#9a7d62]" />
        <span className="ml-2 text-lg text-[#9a7d62]">Loading bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading bookings</h2>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : "An error occurred"}</p>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <style dangerouslySetInnerHTML={{ __html: animations }} />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-brand-primary">Novo Pets Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            {/* Add refresh controls */}
            <div className="flex items-center space-x-2">
              <Select
                value={refreshInterval === false ? "off" : refreshInterval.toString()}
                onValueChange={(value) => {
                  if (value === "off") {
                    setRefreshInterval(false);
                    toast({
                      title: "Auto-refresh disabled",
                      description: "You'll need to manually refresh for new bookings",
                    });
                  } else {
                    const interval = parseInt(value);
                    setRefreshInterval(interval);
                    toast({
                      title: "Auto-refresh enabled",
                      description: `Dashboard will refresh every ${interval / 1000} seconds`,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Loader2 className={`h-4 w-4 mr-2 ${refreshInterval !== false ? "animate-spin" : ""}`} />
                    <span>
                      {refreshInterval === false 
                        ? "Auto-refresh: Off" 
                        : `Refresh: ${refreshInterval / 1000}s`}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Auto-refresh: Off</SelectItem>
                  <SelectItem value="5000">5 seconds</SelectItem>
                  <SelectItem value="15000">15 seconds</SelectItem>
                  <SelectItem value="30000">30 seconds</SelectItem>
                  <SelectItem value="60000">1 minute</SelectItem>
                  <SelectItem value="300000">5 minutes</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Add sound toggle button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center ${soundEnabled ? 'text-green-600' : 'text-gray-400'}`}
                title={soundEnabled ? "Sound notifications enabled" : "Sound notifications disabled"}
              >
                {soundEnabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H2v6h4l5 4V5z"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5 6 9H2v6h4l5 4V5z"></path>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </svg>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="flex items-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-1"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Refresh
              </Button>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
            {newBookingsCount > 0 && (
              <Badge className="bg-green-500 hover:bg-green-600">
                {newBookingsCount} new booking{newBookingsCount > 1 ? 's' : ''}
              </Badge>
            )}
            <div className={`text-xs text-gray-500 flex items-center ${refreshInterval !== false ? 'pulse-animation' : ''}`}>
              <span className="mr-1">Last refreshed:</span> 
              <span className={isFetching ? 'shimmer-animation bg-gray-100 rounded px-1' : ''}>
                {format(lastRefreshTime, 'HH:mm:ss')}
              </span>
              {isFetching && (
                <Loader2 className="h-3 w-3 animate-spin ml-1 text-gray-400" />
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* View toggle: List vs Calendar */}
            <div className="bg-white rounded-md border border-gray-200 p-1 flex">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-brand-tertiary text-white" : ""}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={viewMode === "calendar" ? "bg-brand-tertiary text-white" : ""}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </div>
          </div>
        </div>
        
        {/* Conditional rendering based on view mode */}
        {viewMode === "calendar" ? (
          /* Calendar View */
          <div className="bg-white rounded-lg shadow-sm p-6 min-h-[600px]">
            <BookingCalendar 
              bookings={bookings || []} 
              onStatusChange={handleStatusChange} 
              refetchBookings={refetch}
            />
          </div>
        ) : (
          /* List View */
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="mb-6 space-y-4">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Bookings</TabsTrigger>
                    <TabsTrigger value="grooming">Grooming</TabsTrigger>
                    <TabsTrigger value="hotel">Hotel</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search by pet name, customer name, email, phone, or breed..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Clear filters button */}
                  {(searchQuery || filter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
                
                {/* Results count */}
                {filteredBookings.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredBookings.length} of {bookings?.length || 0} bookings
                  </div>
                )}
              </div>
              
              <BookingsList 
                bookings={filteredBookings} 
                onStatusChange={handleStatusChange} 
              />
            </div>
          </div>
        )}
      </main>
      
      {/* Completion Confirmation Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Booking as Completed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this booking as completed? 
              This will archive the booking from the active list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCompletion(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingCompletion) {
                  updateBookingStatus(
                    pendingCompletion.id, 
                    "completed", 
                    pendingCompletion.bookingType
                  );
                  setPendingCompletion(null);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Completion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Cancellation Confirmation Dialog */}
      <AlertDialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? 
              This action will mark the booking as cancelled and archive it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCancellation(null)}>
              No, Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingCancellation) {
                  updateBookingStatus(
                    pendingCancellation.id, 
                    "cancelled", 
                    pendingCancellation.bookingType
                  );
                  setPendingCancellation(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookingsList({ bookings, onStatusChange }: { 
  bookings: any[], 
  onStatusChange: (id: number, status: string, bookingType?: string) => void 
}) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No bookings found matching your filters</p>
        <Button variant="outline">Clear Filters</Button>
      </div>
    );
  }
  
  const safeFormatDate = (dateString: string) => {
    try {
      if (!dateString) return "Invalid date";
      
      // Simple validation to check if it looks like a date
      if (!/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return dateString; // Return as is if it doesn't look like ISO format
      }
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return format(date, 'PPP'); // Format: Jan 1, 2021
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="mt-2">
      <div className="grid grid-cols-1 gap-4">
        {bookings.map((booking: any) => (
          <Card key={booking.id} className="overflow-hidden border-l-4 border-l-brand-tertiary">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-4 md:w-2/3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{booking.petName}</h3>
                        <StatusBadge status={booking.status} />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-2 text-xs">
                            {booking.serviceType.toUpperCase()}
                          </Badge>
                          {booking.groomingService && booking.serviceType === "grooming" && (
                            <span>{booking.groomingService}</span>
                          )}
                          {booking.accommodationType && booking.serviceType === "hotel" && (
                            <span>{booking.accommodationType}</span>
                          )}
                        </div>
                        <div className="hidden sm:block">•</div>
                        <div>{booking.petBreed}</div>
                        <div className="hidden sm:block">•</div>
                        <div className="capitalize">{booking.petSize} size</div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <p>
                          <span className="font-medium">Date:</span> {safeFormatDate(booking.appointmentDate)}
                        </p>
                        <p className="hidden sm:inline">•</p>
                        <p className="hidden sm:block">
                          <span className="font-medium">Time:</span> {booking.appointmentTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 md:w-1/3 flex flex-col justify-between">
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-gray-600">{booking.customerPhone}</p>
                    <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <Select 
                      defaultValue={booking.status}
                      onValueChange={(value) => onStatusChange(booking.id, value, booking.serviceType)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
    case "confirmed":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Confirmed</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
} 