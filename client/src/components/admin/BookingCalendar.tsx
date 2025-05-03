import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, parseISO, isToday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal, Settings, Bell, User, Plus, CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Define types
interface Booking {
  id: number;
  serviceType: string;
  groomingService?: string;
  accommodationType?: string;
  appointmentDate: string;
  appointmentTime: string;
  petName: string;
  petBreed: string;
  petSize: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: string;
  groomer?: string;
}

interface BookingCalendarProps {
  bookings: Booking[];
  onStatusChange: (id: number, status: string, serviceType?: string) => void;
}

export default function BookingCalendar({ bookings, onStatusChange }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [filterServiceType, setFilterServiceType] = useState<string | null>("all");
  const [filterPriority, setFilterPriority] = useState<string | null>("all");
  
  // Generate days for current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days at the beginning to align with weekday
  const firstDayOfWeek = monthStart.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const prefixDays = Array.from({ length: firstDayOfWeek }, (_, i) => 
    addDays(monthStart, -(firstDayOfWeek - i))
  );
  
  // Add padding days at the end to complete the grid
  const totalDaysInMonth = calendarDays.length;
  const rowsToFill = Math.ceil((totalDaysInMonth + firstDayOfWeek) / 7);
  const totalCells = rowsToFill * 7;
  const remainingCells = totalCells - (totalDaysInMonth + firstDayOfWeek);
  const suffixDays = Array.from({ length: remainingCells }, (_, i) => 
    addDays(monthEnd, i + 1)
  );
  
  // Combine all days for display
  const allDays = [...prefixDays, ...calendarDays, ...suffixDays];
  
  // Navigation functions
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return bookings.filter(booking => {
      // Filter by service type if selected
      if (filterServiceType && filterServiceType !== "all" && booking.serviceType !== filterServiceType) {
        return false;
      }
      
      // TODO: Implement priority filtering when priorities are defined
      
      try {
        const bookingDate = parseISO(booking.appointmentDate);
        return isSameDay(bookingDate, day);
      } catch (error) {
        console.error("Error parsing date:", booking.appointmentDate);
        return false;
      }
    });
  };
  
  // Get class name for the booking based on service type
  const getBookingClassName = (booking: Booking) => {
    const baseClasses = "p-2 rounded-md mb-1 text-sm cursor-pointer hover:opacity-90 overflow-hidden text-ellipsis";
    switch(booking.serviceType) {
      case "grooming":
        return `${baseClasses} bg-brand-tertiary/90 text-white`;
      case "hotel":
        return `${baseClasses} bg-brand-primary/90 text-white`;
      case "daycare":
        return `${baseClasses} bg-brand-secondary/90 text-white`;
      default:
        return `${baseClasses} bg-gray-500 text-white`;
    }
  };
  
  // Handle booking click
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };
  
  // Status badge components
  const StatusBadge = ({ status }: { status: string }) => {
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
  };
  
  // Service type badge
  const ServiceTypeBadge = ({ type }: { type: string }) => {
    switch (type.toLowerCase()) {
      case "grooming":
        return <Badge className="bg-brand-tertiary text-white">Grooming</Badge>;
      case "hotel":
        return <Badge className="bg-brand-primary text-white">Hotel</Badge>;
      case "daycare":
        return <Badge className="bg-brand-secondary text-white">Daycare</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };
  
  // Get time slot display
  const getTimeDisplay = (booking: Booking) => {
    return booking.appointmentTime;
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-brand-primary">Bookings Calendar</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToToday}
            className="ml-2 text-brand-primary hover:bg-brand-light"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={filterServiceType || "all"} onValueChange={(value) => setFilterServiceType(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="grooming">Grooming</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
              <SelectItem value="daycare">Daycare</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority || "all"} onValueChange={(value) => setFilterPriority(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            className="ml-2 text-gray-600 hover:bg-gray-100"
            onClick={() => {
              setFilterServiceType("all");
              setFilterPriority("all");
            }}
          >
            Reset Filters
          </Button>
          
          <Button variant="outline" className="border-none">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="default" className="bg-brand-tertiary hover:bg-brand-tertiary/90">
            <Plus className="h-5 w-5 mr-1" /> New Booking
          </Button>
        </div>
      </div>
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium">
          {format(currentDate, "MMMM yyyy")}
        </h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-grow">
        {/* Weekday Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
          <div
            key={i}
            className="text-center py-2 font-medium text-gray-600 bg-gray-100 rounded-md"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {allDays.map((day, i) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const dayBookings = getBookingsForDay(day);
          
          return (
            <div
              key={i}
              className={`
                min-h-[120px] border rounded-md p-1 overflow-y-auto
                ${!isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"}
                ${isToday(day) ? "border-brand-tertiary" : "border-gray-200"}
              `}
            >
              <div className="text-right p-1">
                <span className={`
                  inline-block rounded-full w-7 h-7 text-center leading-7
                  ${isToday(day) ? "bg-brand-tertiary text-white" : ""}
                `}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="space-y-1 mt-1">
                {dayBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className={getBookingClassName(booking)}
                    onClick={() => handleBookingClick(booking)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{getTimeDisplay(booking)}</span>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {booking.petName} - {booking.customerName}
                    </div>
                  </div>
                ))}
                
                {dayBookings.length > 3 && (
                  <div className="text-center text-sm text-gray-600 cursor-pointer hover:underline">
                    + {dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Booking Details Dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <ServiceTypeBadge type={selectedBooking?.serviceType || "unknown"} />
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pet</p>
                  <p className="font-medium">{selectedBooking.petName}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.petBreed} ({selectedBooking.petSize})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{selectedBooking.appointmentDate}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.appointmentTime}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-medium capitalize">{selectedBooking.serviceType}</p>
                {selectedBooking.groomingService && (
                  <p className="text-sm text-gray-600">{selectedBooking.groomingService}</p>
                )}
                {selectedBooking.accommodationType && (
                  <p className="text-sm text-gray-600">{selectedBooking.accommodationType}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{selectedBooking.customerName}</p>
                <p className="text-sm text-gray-600">{selectedBooking.customerPhone}</p>
                <p className="text-sm text-gray-600">{selectedBooking.customerEmail}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <StatusBadge status={selectedBooking.status} />
                </div>
              </div>
              
              {selectedBooking.groomer && (
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{selectedBooking.groomer}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <div className="flex space-x-2">
              <Select 
                defaultValue={selectedBooking?.status || "pending"}
                onValueChange={(value) => {
                  if (selectedBooking) {
                    onStatusChange(selectedBooking.id, value, selectedBooking.serviceType);
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
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
            
            <div className="flex space-x-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="default" className="bg-brand-tertiary hover:bg-brand-tertiary/90">
                Edit Booking
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 