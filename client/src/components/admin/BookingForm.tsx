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
import { ServiceType, PetSize, PaymentMethod } from "shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define available time slots
const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
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
  
  // Payment details
  paymentMethod: z.enum(["cash", "bank_transfer", "online"], {
    required_error: "Please select a payment method",
  }),
  
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

      // Format the date to YYYY-MM-DD while preserving the exact date selected
      // This ensures the local date selected by the user is preserved
      const selectedDate = values.appointmentDate;
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log("Selected date:", selectedDate);
      console.log("Formatted date for submission:", formattedDate);
      
      // Prepare data for submission
      const bookingData = {
        ...values,
        appointmentDate: formattedDate,
        addOnServices: "", // Default to empty string
      };
      
      // Make API request
      const adminEmail = sessionStorage.getItem("adminEmail");
      const response = await apiRequest("POST", "/api/bookings", bookingData, {
        headers: {
          "admin-email": adminEmail || "",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create booking");
      }
      
      const data = await response.json();
      
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
  
  // Define payment method options
  const paymentMethodOptions = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "online", label: "Online Payment" },
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
    <div className="max-h-[70vh] overflow-y-auto px-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="service" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="pet">Pet Details</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>
            
            {/* Service Tab */}
            <TabsContent value="service" className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                      <FormLabel>Grooming Package</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                        <FormLabel>Accommodation Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel>Number of Days</FormLabel>
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
                      <FormLabel>Number of Hours</FormLabel>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Appointment Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
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
                      <FormLabel>Appointment Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Assign Groomer (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                    <FormLabel>Pet Name</FormLabel>
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
                    <FormLabel>Pet Breed</FormLabel>
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
                    <FormLabel>Pet Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Special Requests (Optional)</FormLabel>
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
                    <FormLabel>Customer Name</FormLabel>
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
                    <FormLabel>Phone Number</FormLabel>
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethodOptions.map(option => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-brand-tertiary hover:bg-brand-tertiary/90">
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