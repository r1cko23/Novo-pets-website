import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ServiceType, PetSize } from "shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define available time slots (10am-7pm, last appointment at 6pm)
const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

// Define the schema for booking form
const bookingFormSchema = z.object({
  // Service details
  serviceType: z.enum(["grooming", "hotel", "daycare"], {
    required_error: "Please select a service type",
  }),
  groomingService: z.string().optional(),
  accommodationType: z.string().optional(),
  
  // Duration
  durationHours: z.number().optional(),
  durationDays: z.number().optional(),
  
  // Scheduling
  appointmentDate: z.date({
    required_error: "Please select a date",
  }),
  appointmentTime: z.string({
    required_error: "Please select a time slot",
  }),
  
  // Pet information
  petName: z.string().min(1, { message: "Please enter your pet's name" }),
  petBreed: z.string().min(1, { message: "Please enter your pet's breed" }),
  petSize: z.enum(["small", "medium", "large", "giant"], {
    required_error: "Please select your pet's size",
  }),
  
  // Special requests
  specialRequests: z.string().optional(),
  
  // Customer information
  customerName: z.string().min(1, { message: "Please enter the customer's name" }),
  customerPhone: z.string().min(6, { message: "Please enter a valid phone number" }),
  customerEmail: z.string().email({ message: "Please enter a valid email address" }),
  
  // Status
  status: z.enum(["pending", "confirmed"], {
    required_error: "Please select a status",
  }),

  // For grooming, a groomer can be assigned
  groomer: z.string().optional(),
}).refine(data => {
  if (data.serviceType === "grooming" && !data.groomingService) {
    return false;
  }
  return true;
}, {
  message: "Please select a grooming service",
  path: ["groomingService"],
}).refine(data => {
  if (data.serviceType === "hotel" && !data.accommodationType) {
    return false;
  }
  return true;
}, {
  message: "Please select an accommodation type",
  path: ["accommodationType"],
}).refine(data => {
  if (data.serviceType === "hotel" && !data.durationDays) {
    return false;
  }
  return true;
}, {
  message: "Please enter the number of days",
  path: ["durationDays"],
}).refine(data => {
  if (data.serviceType === "daycare" && !data.durationHours) {
    return false;
  }
  return true;
}, {
  message: "Please enter the number of hours",
  path: ["durationHours"],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Add a function to convert time from AM/PM format to 24-hour format
const convertTo24Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  
  console.log(`Converting time format: "${timeStr}"`);
  
  // Remove any spaces and convert to uppercase for consistency
  const time = timeStr.replace(/\s/g, '').toUpperCase();
  
  // Extract the components
  const match = time.match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
  if (!match) {
    console.error(`Invalid time format: "${timeStr}"`);
    return timeStr;
  }
  
  const [_, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr, 10);
  
  // Convert hour based on AM/PM
  if (period === 'PM' && hour < 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  // Format hour with leading zero if needed
  const hourFormatted = hour.toString().padStart(2, '0');
  
  const result = `${hourFormatted}:${minuteStr}`;
  console.log(`Converted time: "${timeStr}" to "${result}"`);
  
  return result;
};

export default function BookingForm({ onSuccess, onCancel }: BookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up the form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceType: "grooming",
      status: "pending",
      appointmentDate: new Date(),
    },
  });
  
  // Watch for service type changes to conditionally render fields
  const serviceType = form.watch("serviceType");
  
  // Handle form submission
  const onSubmit = async (values: BookingFormValues) => {
    try {
      setIsSubmitting(true);

      // Format the date to YYYY-MM-DD without timezone issues
      // Extract year, month, day directly from the date object
      const selectedDate = values.appointmentDate;
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Convert time from AM/PM to 24-hour format (e.g., "09:00 AM" to "09:00")
      const formattedTime = convertTo24Hour(values.appointmentTime);
      
      console.log("Selected date:", selectedDate);
      console.log("Formatted date for submission (YYYY-MM-DD):", formattedDate);
      console.log("Formatted time for submission (24h):", formattedTime);
      
      // Prepare data for submission - ensure all required fields are included
      const bookingData = {
        // Service details
        serviceType: values.serviceType,
        groomingService: values.serviceType === "grooming" ? values.groomingService : undefined,
        accommodationType: values.serviceType === "hotel" ? values.accommodationType : undefined,
        
        // Duration for hotel/daycare
        durationHours: values.serviceType === "daycare" ? values.durationHours : undefined,
        durationDays: values.serviceType === "hotel" ? values.durationDays : undefined,
        
        // Appointment details
        appointmentDate: formattedDate,
        appointmentTime: formattedTime,
        
        // Pet information
        petName: values.petName,
        petBreed: values.petBreed,
        petSize: values.petSize,
        
        // Special requests
        specialRequests: values.specialRequests || "",
        
        // Customer information
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        
        // Status
        status: values.status,
        
        // Groomer (if assigned)
        groomer: values.groomer || undefined,
        
        // Additional fields that might be expected by the API
        addOnServices: "",
        needsTransport: false,
        transportType: undefined,
        pickupAddress: undefined,
        includeTreats: false,
        treatType: undefined,
        totalPrice: undefined, // This would typically be calculated by the server
        reference: undefined,  // This would typically be generated by the server
      };
      
      console.log("Submitting booking data:", bookingData);
      
      // Make API request
      const adminEmail = sessionStorage.getItem("adminEmail");
      if (!adminEmail) {
        throw new Error("Admin not logged in. Please log in again.");
      }
      
      const response = await apiRequest("POST", "/api/bookings", bookingData, {
        headers: {
          "admin-email": adminEmail,
          "Content-Type": "application/json"
        },
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to create booking";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("API error response:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Booking created successfully:", data);
      
      toast({
        title: "Booking Created",
        description: `Successfully created booking for ${values.petName}`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Define the grooming service options
  const groomingServiceOptions = [
    { value: "Basic Groom", label: "Basic Groom" },
    { value: "Full Groom", label: "Full Groom" },
    { value: "Luxury Spa Package", label: "Luxury Spa Package" },
  ];
  
  // Define accommodation type options
  const accommodationOptions = [
    { value: "Standard", label: "Standard" },
    { value: "Owner's Cage", label: "Owner's Cage" },
    { value: "Luxury Suite", label: "Luxury Suite" },
  ];
  
  // Define pet size options
  const petSizeOptions = [
    { value: "small", label: "Small (up to 10kg)" },
    { value: "medium", label: "Medium (10-25kg)" },
    { value: "large", label: "Large (25-40kg)" },
    { value: "giant", label: "Giant (40kg+)" },
  ];
  
  // Define groomer options (this would typically come from your database)
  const groomerOptions = [
    { value: "Groomer 1", label: "Groomer 1" },
    { value: "Groomer 2", label: "Groomer 2" },
    { value: "Groomer 3", label: "Groomer 3" },
  ];
  
  // Reset conditional fields when service type changes
  useEffect(() => {
    if (serviceType === "grooming") {
      form.setValue("accommodationType", undefined);
      form.setValue("durationDays", undefined);
      form.setValue("durationHours", undefined);
    } else if (serviceType === "hotel") {
      form.setValue("groomingService", undefined);
      form.setValue("durationHours", undefined);
      form.setValue("groomer", undefined);
    } else if (serviceType === "daycare") {
      form.setValue("groomingService", undefined);
      form.setValue("accommodationType", undefined);
      form.setValue("durationDays", undefined);
      form.setValue("groomer", undefined);
    }
  }, [serviceType, form]);
  
  return (
    <div className="max-h-[70vh] overflow-y-auto px-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="service" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="service" className="data-[state=active]:bg-white">Service</TabsTrigger>
              <TabsTrigger value="pet" className="data-[state=active]:bg-white">Pet Details</TabsTrigger>
              <TabsTrigger value="customer" className="data-[state=active]:bg-white">Customer</TabsTrigger>
              <TabsTrigger value="status" className="data-[state=active]:bg-white">Status</TabsTrigger>
            </TabsList>
            
            {/* Service Tab */}
            <TabsContent value="service" className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Service Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 bg-white">
                          <SelectValue placeholder="Select a service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="grooming">Grooming</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="daycare">Daycare</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {serviceType === "grooming" && (
                <FormField
                  control={form.control}
                  name="groomingService"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Grooming Package</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder="Select a grooming package" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groomingServiceOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {serviceType === "hotel" && (
                <>
                  <FormField
                    control={form.control}
                    name="accommodationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Accommodation Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 bg-white">
                              <SelectValue placeholder="Select accommodation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accommodationOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Number of Days</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {serviceType === "daycare" && (
                <FormField
                  control={form.control}
                  name="durationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Number of Hours</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-gray-700 font-medium">Appointment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full h-12 pl-3 text-left font-normal bg-white",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MMMM do, yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="appointmentTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Appointment Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder="Select a time slot" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map(slot => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {serviceType === "grooming" && (
                <FormField
                  control={form.control}
                  name="groomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Assign Groomer (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder="Select a groomer (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groomerOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </TabsContent>
            
            {/* Pet Details Tab */}
            <TabsContent value="pet" className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="petName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Pet Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="petBreed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Pet Breed</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="petSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Pet Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-white">
                          <SelectValue placeholder="Select pet size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {petSizeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Special Requests (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special instructions or requests"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            {/* Customer Tab */}
            <TabsContent value="customer" className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Customer Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            {/* Status Tab */}
            <TabsContent value="status" className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Booking Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="h-12 px-6">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="h-12 px-6 bg-brand-tertiary hover:bg-brand-tertiary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Booking"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 