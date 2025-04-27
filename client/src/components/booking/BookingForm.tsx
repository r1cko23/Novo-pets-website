import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Check, CreditCard, Landmark, BanknoteIcon, Loader2 } from "lucide-react";
import { 
  bookingFormSchema, 
  ServiceType, 
  PetSize, 
  PaymentMethod, 
  type BookingFormValues 
} from "@shared/schema";
import { cn, generateTimeSlots, getBookingReference } from "@/lib/utils";
import PetDetails from "./PetDetails";
import { TimeSlot } from "@/types";

export default function BookingForm() {
  const [step, setStep] = useState(1);
  const [bookingReference, setBookingReference] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedGroomer, setSelectedGroomer] = useState<string | null>(null);
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Default time slots (will be filtered based on availability)
  const defaultTimeSlots = generateTimeSlots();

  // Form definition
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceType: ServiceType.GROOMING,
      groomingService: "",
      accommodationType: "",
      durationHours: undefined,
      durationDays: undefined,
      appointmentDate: "",
      appointmentTime: "",
      petName: "",
      petBreed: "",
      petSize: PetSize.SMALL,
      addOnServices: [],
      specialRequests: "",
      needsTransport: false,
      transportType: "",
      pickupAddress: "",
      includeTreats: false,
      treatType: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      paymentMethod: PaymentMethod.CASH,
    },
  });
  
  // Get the selected date from the form
  const selectedDate = form.watch("appointmentDate");
  
  // Function to check if a date is fully booked
  const checkDateAvailability = async (date: string) => {
    try {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const response = await apiRequest("GET", `/api/availability?date=${formattedDate}`);
      const data = await response.json();
      
      return data.availableTimeSlots && data.availableTimeSlots.length > 0;
    } catch (error) {
      console.error("Error checking date availability:", error);
      return true; // Assume there are slots available in case of error
    }
  };
  
  // Query to fetch available time slots when date changes
  const { data: availabilityData, isLoading: isLoadingAvailability, refetch: refetchAvailability } = useQuery({
    queryKey: ["availability", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return { availableTimeSlots: [] };
      
      const formattedDate = format(new Date(selectedDate), "yyyy-MM-dd");
      const response = await apiRequest("GET", `/api/availability?date=${formattedDate}`);
      const result = await response.json();
      console.log("Fetched availability data:", result);
      return result;
    },
    enabled: !!selectedDate, // Only run query when a date is selected
    staleTime: 0, // Always refetch when the date changes to ensure up-to-date availability
    gcTime: 0 // Don't cache availability data to ensure freshness
  });
  
  // Update available time slots when data changes
  useEffect(() => {
    if (availabilityData?.availableTimeSlots) {
      // Explicitly type the data coming from the API
      const typedTimeSlots: TimeSlot[] = availabilityData.availableTimeSlots;
      console.log("Setting available time slots:", typedTimeSlots);
      
      // DEBUG: Check the 'available' property on each slot
      typedTimeSlots.forEach(slot => {
        console.log(`DEBUG slot: Time=${slot.time}, Groomer=${slot.groomer}, Available=${slot.available}`);
      });
      
      setAvailableTimeSlots(typedTimeSlots);
      
      // Reset the time selection if the previously selected time is no longer available
      const currentTime = form.getValues("appointmentTime");
      const currentGroomer = selectedGroomer;
      
      if (currentTime && currentGroomer) {
        const isStillAvailable = typedTimeSlots.some(
          slot => slot.time === currentTime && 
                 slot.groomer === currentGroomer && 
                 slot.available === true
        );
        
        if (!isStillAvailable) {
          form.setValue("appointmentTime", "");
        }
      }
    } else {
      // Clear available time slots if no data is available
      setAvailableTimeSlots([]);
    }
  }, [availabilityData, form, selectedGroomer]);
  
  // Group time slots by groomer and sort to put available slots first
  const timeSlotsByGroomer = availableTimeSlots.reduce((acc, slot) => {
    if (!acc[slot.groomer]) {
      acc[slot.groomer] = [];
    }
    acc[slot.groomer].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);
  
  // Sort time slots within each groomer to put available slots first
  Object.keys(timeSlotsByGroomer).forEach(groomer => {
    timeSlotsByGroomer[groomer].sort((a, b) => {
      // Available slots come first
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      // Otherwise sort by time
      return a.time.localeCompare(b.time);
    });
  });

  // Debug: Print grouped time slots
  console.log("DEBUG timeSlotsByGroomer:", JSON.stringify(timeSlotsByGroomer, null, 2));

  // Get list of groomers with slots
  const groomersWithSlots = Object.keys(timeSlotsByGroomer);
  
  // Mutation for submitting form
  const mutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: (data) => {
      // After successful booking, invalidate and refetch availability data
      // to make sure it's updated for all users
      refetchAvailability();
      
      setBookingReference(getBookingReference());
      setStep(5); // Move to confirmation step
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully scheduled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: BookingFormValues) => {
    mutation.mutate(data);
  };
  
  const nextStep = () => {
    const fieldsByStep = {
      1: ["serviceType"],
      2: ["appointmentDate", "appointmentTime"],
      3: ["petName", "petBreed", "petSize"],
      4: ["customerName", "customerPhone", "customerEmail"],
    };
    
    const currentStepFields = fieldsByStep[step as keyof typeof fieldsByStep] || [];
    
    // Validate only the fields for the current step
    const validateFields = async () => {
      const result = await form.trigger(currentStepFields as any);
      if (result) {
        setStep(prev => prev + 1);
      }
    };
    
    validateFields();
  };
  
  const prevStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Function to display all possible time slots, including booked ones
  const getTimeSlotDisplay = (groomer: string) => {
    // All possible time slots
    const allTimeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
    
    // Set of available times for this groomer
    const availableTimesSet = new Set(
      timeSlotsByGroomer[groomer]?.map(slot => slot.time) || []
    );
    
    return allTimeSlots.map(time => ({
      time,
      groomer,
      available: availableTimesSet.has(time)
    }));
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-[#f8f5f2] rounded-lg shadow-lg overflow-hidden">
      <div className="md:flex">
        {/* Left sidebar with steps */}
        <div className="md:w-1/3 bg-[#9a7d62] p-8 text-white">
          <h3 className="font-playfair text-2xl font-bold mb-4">How It Works</h3>
          <ul className="space-y-6">
            <StepIndicator 
              number={1} 
              title="Select Your Service" 
              description="Choose from our premium service options" 
              active={step === 1}
              completed={step > 1}
            />
            <StepIndicator 
              number={2} 
              title="Pick Date & Time" 
              description="Select your preferred appointment slot" 
              active={step === 2}
              completed={step > 2}
            />
            <StepIndicator 
              number={3} 
              title="Pet Details" 
              description="Tell us about your furry friend" 
              active={step === 3}
              completed={step > 3}
            />
            <StepIndicator 
              number={4} 
              title="Confirm Booking" 
              description="Complete your contact details" 
              active={step === 4}
              completed={step > 4}
            />
          </ul>
          
          <div className="mt-8 pt-8 border-t border-white/20">
            <h4 className="font-montserrat font-semibold mb-2">Operating Hours</h4>
            <p className="text-sm opacity-80">9 AM - 6 PM (Last Call: 5 PM)</p>
            <p className="text-sm opacity-80 mt-4">Need help? Contact us at:</p>
            <p className="font-medium mt-1">(+63) 912-345-6789</p>
          </div>
        </div>
        
        {/* Main form content */}
        <div className="md:w-2/3 p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Select Service */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">Select a Service</h3>
                  
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            className="space-y-4"
                          >
                            <ServiceRadioItem
                              value={ServiceType.GROOMING} 
                              title="Luxury Pet Grooming"
                              description="Full-service grooming with premium treatments"
                              checked={field.value === ServiceType.GROOMING}
                            />
                            <ServiceRadioItem
                              value={ServiceType.HOTEL}
                              title="Pet Hotel Stay"
                              description="Comfortable accommodations for your pet"
                              checked={field.value === ServiceType.HOTEL}
                            />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-8 flex justify-end">
                    <Button 
                      type="button" 
                      className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white"
                      onClick={nextStep}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Date & Time */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">Choose Date & Time</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="appointmentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col w-full">
                          <FormLabel className="mb-2">Appointment Date</FormLabel>
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
                                    format(new Date(field.value), "PPP")
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
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={async (date) => {
                                  if (date) {
                                    const dateString = date.toISOString();
                                    field.onChange(dateString);
                                    
                                    // Force refetch the availability data for this date
                                    await refetchAvailability();
                                    
                                    // Check availability for the selected date
                                    const hasAvailability = await checkDateAvailability(dateString);
                                    if (!hasAvailability) {
                                      toast({
                                        title: "No Available Slots",
                                        description: "All appointments for this date are booked. Please select another date.",
                                        variant: "destructive",
                                      });
                                    }
                                    
                                    // Reset time when date changes
                                    form.setValue("appointmentTime", "");
                                  } else {
                                    field.onChange("");
                                  }
                                }}
                                disabled={(date) => {
                                  // Disable past dates and Sundays
                                  return (
                                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                    date.getDay() === 0
                                  );
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="groomer"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="mb-2">Groomer</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedGroomer(value);
                                // Reset time when groomer changes
                                form.setValue("appointmentTime", "");
                              }}
                              value={field.value}
                              disabled={!selectedDate || isLoadingAvailability}
                              onOpenChange={(open) => {
                                // Refetch availability data when the dropdown is opened
                                if (open && selectedDate) {
                                  refetchAvailability();
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  {isLoadingAvailability ? (
                                    <div className="flex items-center justify-center space-x-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span>Loading...</span>
                                    </div>
                                  ) : (
                                    <SelectValue placeholder={selectedDate ? "Select a groomer" : "First select a date"} />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {groomersWithSlots.length > 0 ? (
                                  groomersWithSlots.map((groomer) => (
                                    <SelectItem key={groomer} value={groomer}>
                                      {groomer}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="px-4 py-6 text-center">
                                    {selectedDate && !isLoadingAvailability ? (
                                      <div className="flex flex-col items-center">
                                        <p className="text-sm text-red-500 font-semibold">No available slots for this date</p>
                                        <p className="text-xs text-gray-500 mt-1">Please select another date</p>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">Please select a date first</p>
                                    )}
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="appointmentTime"
                    render={({ field }) => (
                      <FormItem className="w-full mt-6">
                        <FormLabel className="mb-2">Available Times</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedDate || !selectedGroomer || isLoadingAvailability}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              {isLoadingAvailability ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Loading...</span>
                                </div>
                              ) : (
                                <SelectValue placeholder={selectedGroomer ? "Select a time slot" : "First select a groomer"} />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedGroomer ? (
                              // Check if there are any slots at all
                              timeSlotsByGroomer[selectedGroomer]?.length > 0 ? (
                                // Map through and display the slots
                                timeSlotsByGroomer[selectedGroomer].map((slot) => (
                                  <SelectItem 
                                    key={`${slot.time}-${slot.groomer}`} 
                                    value={slot.time}
                                    disabled={!slot.available}
                                    className={cn(
                                      !slot.available && "opacity-70 line-through text-red-400 cursor-not-allowed bg-gray-100 relative"
                                    )}
                                  >
                                    <div className="flex justify-between w-full items-center">
                                      <span>{slot.time}</span>
                                      {!slot.available && (
                                        <span className="text-red-500 text-xs font-medium ml-2">(Booked)</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                // No slots for this groomer
                                <div className="px-4 py-6 text-center">
                                  <div className="flex flex-col items-center">
                                    <p className="text-sm text-red-500 font-semibold">No slots available</p>
                                    <p className="text-xs text-gray-500 mt-1">Please select another groomer or date</p>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="px-4 py-6 text-center">
                                {selectedGroomer && !isLoadingAvailability ? (
                                  <div className="flex flex-col items-center">
                                    <p className="text-sm text-red-500 font-semibold">No available slots for this groomer</p>
                                    <p className="text-xs text-gray-500 mt-1">Please select another groomer</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Please select a groomer first</p>
                                )}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {selectedDate && !selectedGroomer && (
                          <p className="text-sm text-amber-500 mt-1">
                            Please select a groomer to see available time slots.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-8 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white"
                      onClick={nextStep}
                      disabled={!selectedDate || !form.getValues("appointmentTime")}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Pet Details */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">Tell Us About Your Pet</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="petName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pet Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Max" {...field} />
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
                            <Input placeholder="e.g. Golden Retriever" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="petSize"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Pet Size</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                          >
                            <SizeRadioItem
                              value={PetSize.SMALL}
                              title="Small"
                              description="Up to 10kg"
                              checked={field.value === PetSize.SMALL}
                            />
                            <SizeRadioItem
                              value={PetSize.MEDIUM}
                              title="Medium"
                              description="10-25kg"
                              checked={field.value === PetSize.MEDIUM}
                            />
                            <SizeRadioItem
                              value={PetSize.LARGE}
                              title="Large"
                              description="25-40kg"
                              checked={field.value === PetSize.LARGE}
                            />
                            <SizeRadioItem
                              value={PetSize.GIANT}
                              title="Giant"
                              description="40kg+"
                              checked={field.value === PetSize.GIANT}
                            />
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="specialRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requests or Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special instructions or health concerns we should know about" 
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="p-4 border rounded-md">
                    <FormField
                      control={form.control}
                      name="needsTransport"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Add Transport Service
                            </FormLabel>
                            <FormDescription>
                              I would like to add pick-up/drop-off service
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("needsTransport") && (
                      <div className="mt-4 pl-7">
                        <FormField
                          control={form.control}
                          name="transportType"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Transport Type</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="space-y-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="one_way" id="one_way" />
                                    <Label htmlFor="one_way">One-way Transport (₱280)</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="round_trip" id="round_trip" />
                                    <Label htmlFor="round_trip">Round-trip Transport (₱380)</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="pickupAddress"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Pickup Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter your complete address for pickup" 
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white"
                      onClick={nextStep}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 4: Contact & Payment */}
              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">Contact Details</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full Name" {...field} />
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
                              <Input placeholder="e.g. 09123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="For booking confirmation" 
                              type="email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-start">
                      <Checkbox id="terms" className="mt-1" required />
                      <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                        I agree to Novo Pets' <a href="#" className="text-[#9a7d62] hover:underline">Terms & Conditions</a> and <a href="#" className="text-[#9a7d62] hover:underline">Privacy Policy</a>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? "Processing..." : "Confirm Booking"}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Confirmation Step */}
              {step === 5 && (
                <div className="text-center py-8">
                  <div className="mb-8">
                    <div className="inline-block p-3 rounded-full bg-[#65b891]/20 text-[#65b891]">
                      <Check className="h-12 w-12" />
                    </div>
                  </div>
                  
                  <h3 className="font-playfair text-2xl font-bold text-[#9a7d62] mb-4">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-6">
                    Your appointment has been successfully scheduled. We've sent a confirmation to your email and phone.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg mb-8 inline-block">
                    <div className="text-left space-y-3">
                      <div className="flex">
                        <span className="font-semibold w-32 text-gray-700">Booking ID:</span>
                        <span className="text-gray-900">#{bookingReference}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32 text-gray-700">Service:</span>
                        <span className="text-gray-900">{form.getValues("serviceType").replace("_", " ")}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32 text-gray-700">Date & Time:</span>
                        <span className="text-gray-900">
                          {form.getValues("appointmentDate") 
                            ? format(new Date(form.getValues("appointmentDate")), "MMMM d, yyyy")
                            : ""} at {form.getValues("appointmentTime")}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32 text-gray-700">Pet:</span>
                        <span className="text-gray-900">
                          {form.getValues("petName")} ({form.getValues("petBreed")})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Button className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white mr-4">
                      Add to Calendar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/5"
                      onClick={() => {
                        form.reset();
                        setStep(1);
                      }}
                    >
                      Book Another Appointment
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  number: number;
  title: string;
  description: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ number, title, description, active, completed }: StepIndicatorProps) {
  return (
    <li className="flex">
      <div 
        className={cn(
          "flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full",
          completed 
            ? "bg-white/40 text-white" 
            : "bg-white text-[#9a7d62]",
          active || completed
            ? "ring-4 ring-white/30"
            : ""
        )}
      >
        {completed ? <Check className="h-4 w-4" /> : number}
      </div>
      <div className="ml-4">
        <h4 className={cn(
          "font-montserrat font-semibold",
          active || completed ? "text-white" : "text-white/80"
        )}>
          {title}
        </h4>
        <p className={cn(
          "text-sm",
          active || completed ? "opacity-90" : "opacity-60"
        )}>
          {description}
        </p>
      </div>
    </li>
  );
}

interface ServiceRadioItemProps {
  value: string;
  title: string;
  description: string;
  checked: boolean;
}

function ServiceRadioItem({ value, title, description, checked }: ServiceRadioItemProps) {
  return (
    <div className={cn(
      "border rounded-md p-4 cursor-pointer",
      checked 
        ? "border-[#9a7d62] bg-[#9a7d62]/5" 
        : "border-gray-200 hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
    )}>
      <div className="flex items-start">
        <RadioGroupItem value={value} id={value} className="mt-1" />
        <label htmlFor={value} className="ml-3 cursor-pointer flex-grow">
          <span className="block font-montserrat font-medium text-gray-900">{title}</span>
          <span className="block text-sm text-gray-500 mt-1">{description}</span>
        </label>
      </div>
    </div>
  );
}

// Add SizeRadioItem component
interface SizeRadioItemProps {
  value: string;
  title: string;
  description: string;
  checked: boolean;
}

function SizeRadioItem({ value, title, description, checked }: SizeRadioItemProps) {
  return (
    <div className={cn(
      "border rounded-md p-3 cursor-pointer text-center",
      checked 
        ? "border-[#9a7d62] bg-[#9a7d62]/5" 
        : "border-gray-200 hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
    )}>
      <RadioGroupItem value={value} id={value} className="hidden" />
      <label htmlFor={value} className="cursor-pointer block">
        <span className="block font-montserrat font-medium text-gray-900">{title}</span>
        <span className="block text-xs text-gray-500 mt-1">{description}</span>
      </label>
    </div>
  );
}
