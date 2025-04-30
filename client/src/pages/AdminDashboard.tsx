import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [filter, setFilter] = useState("all");

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
  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
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
        return data;
      } catch (error) {
        console.error("Error in booking fetch function:", error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Filter bookings based on active tab
  const filteredBookings = bookings ? bookings.filter((booking: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "grooming") return booking.serviceType === "grooming";
    if (activeTab === "hotel") return booking.serviceType === "hotel";
    return true;
  }).filter((booking: any) => {
    if (filter === "all") return true;
    return booking.status === filter;
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

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      const adminEmail = sessionStorage.getItem("adminEmail");
      const response = await apiRequest("PUT", `/api/bookings/${bookingId}/status`, 
        { status: newStatus },
        { headers: { "admin-email": adminEmail } }
      );
      
      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }
      
      toast({
        title: "Status updated",
        description: `Booking status updated to ${newStatus}`,
      });
      
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-[#9a7d62]">Novo Pets Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
            <p className="text-gray-600">Manage all pet grooming and hotel bookings</p>
          </div>
          
          <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center space-x-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="default" 
              onClick={() => refetch()}
              className="bg-[#9a7d62] hover:bg-[#9a7d62]/90"
            >
              Refresh
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Bookings</TabsTrigger>
            <TabsTrigger value="grooming">Grooming</TabsTrigger>
            <TabsTrigger value="hotel">Pet Hotel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <BookingsList 
              bookings={filteredBookings} 
              onStatusChange={handleStatusChange} 
            />
          </TabsContent>
          
          <TabsContent value="grooming" className="mt-0">
            <BookingsList 
              bookings={filteredBookings} 
              onStatusChange={handleStatusChange} 
            />
          </TabsContent>
          
          <TabsContent value="hotel" className="mt-0">
            <BookingsList 
              bookings={filteredBookings} 
              onStatusChange={handleStatusChange} 
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Bookings list component
function BookingsList({ bookings, onStatusChange }: { 
  bookings: any[], 
  onStatusChange: (id: number, status: string) => void 
}) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">No bookings found</p>
      </div>
    );
  }

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{booking.petName}</CardTitle>
                <CardDescription>{booking.petBreed} ({booking.petSize})</CardDescription>
              </div>
              <StatusBadge status={booking.status} />
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service:</span>
                <span className="font-medium">
                  {booking.serviceType === "grooming" 
                    ? `Grooming (${booking.groomingService || 'Basic'})` 
                    : `Pet Hotel (${booking.accommodationType || 'Standard'})`}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date & Time:</span>
                <span className="font-medium">
                  {safeFormatDate(booking.appointmentDate)} at {booking.appointmentTime}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium">{booking.customerName}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Contact:</span>
                <span className="font-medium">{booking.customerPhone}</span>
              </div>
              
              {booking.specialRequests && (
                <div className="text-sm mt-2">
                  <p className="text-gray-500 mb-1">Special Requests:</p>
                  <p className="text-sm">{booking.specialRequests}</p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="pt-0">
            <Select 
              defaultValue={booking.status}
              onValueChange={(value) => onStatusChange(booking.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800", 
    completed: "bg-blue-100 text-blue-800",
  };
  
  const color = colorMap[status] || "bg-gray-100 text-gray-800";
  
  return (
    <Badge className={`${color} font-medium`} variant="outline">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
} 