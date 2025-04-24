import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { CalendarIcon, Check, CreditCard, Landmark, BanknoteIcon } from "lucide-react";
import { 
  bookingFormSchema, 
  ServiceType, 
  PetSize, 
  PaymentMethod, 
  type BookingFormValues 
} from "@shared/schema";
import { cn, generateTimeSlots, getBookingReference } from "@/lib/utils";
import PetDetails from "./PetDetails";

export default function BookingForm() {
  const [step, setStep] = useState(1);
  const [bookingReference, setBookingReference] = useState("");
  const { toast } = useToast();
  
  const timeSlots = generateTimeSlots();

  // Form definition
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceType: ServiceType.GROOMING,
      appointmentDate: "",
      appointmentTime: "",
      petName: "",
      petBreed: "",
      petSize: PetSize.SMALL,
      specialRequests: "",
      needsTransport: false,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      paymentMethod: PaymentMethod.CASH,
    },
  });
  
  // Mutation for submitting form
  const mutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: (data) => {
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
      4: ["customerName", "customerPhone", "customerEmail", "paymentMethod"],
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
              description="Complete your contact and payment details" 
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
                            <ServiceRadioItem
                              value={ServiceType.DAYCARE}
                              title="Daycare & Playcare"
                              description="Supervised activities and socialization"
                              checked={field.value === ServiceType.DAYCARE}
                            />
                            <ServiceRadioItem
                              value={ServiceType.TRANSPORT}
                              title="Transport Service"
                              description="Pick-up and/or drop-off service"
                              checked={field.value === ServiceType.TRANSPORT}
                            />
                            <ServiceRadioItem
                              value={ServiceType.TREATS}
                              title="Frozen Yogurt Treats"
                              description="Pet-friendly frozen treats"
                              checked={field.value === ServiceType.TREATS}
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
                                onSelect={(date) => {
                                  field.onChange(date ? date.toISOString() : "");
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
                    
                    <FormField
                      control={form.control}
                      name="appointmentTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a time slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timeSlots.map((slot) => (
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
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Pet Details */}
              {step === 3 && (
                <PetDetails 
                  form={form} 
                  onPrevStep={prevStep} 
                  onNextStep={nextStep}
                />
              )}
              
              {/* Step 4: Contact & Payment */}
              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">Contact & Payment Details</h3>
                  
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
                    
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Payment Method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                              <div className={cn(
                                "border rounded-md p-3 cursor-pointer",
                                field.value === PaymentMethod.CASH
                                  ? "border-[#9a7d62] bg-[#9a7d62]/5"
                                  : "border-gray-200 hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
                              )}>
                                <RadioGroupItem
                                  value={PaymentMethod.CASH}
                                  id="cash"
                                  className="hidden"
                                />
                                <label
                                  htmlFor="cash"
                                  className="flex items-center cursor-pointer"
                                >
                                  <BanknoteIcon className="h-4 w-4 text-green-600 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">Cash on Delivery</span>
                                </label>
                              </div>
                              
                              <div className={cn(
                                "border rounded-md p-3 cursor-pointer",
                                field.value === PaymentMethod.BANK_TRANSFER
                                  ? "border-[#9a7d62] bg-[#9a7d62]/5"
                                  : "border-gray-200 hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
                              )}>
                                <RadioGroupItem
                                  value={PaymentMethod.BANK_TRANSFER}
                                  id="bank"
                                  className="hidden"
                                />
                                <label
                                  htmlFor="bank"
                                  className="flex items-center cursor-pointer"
                                >
                                  <Landmark className="h-4 w-4 text-blue-600 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
                                </label>
                              </div>
                              
                              <div className={cn(
                                "border rounded-md p-3 cursor-pointer",
                                field.value === PaymentMethod.ONLINE
                                  ? "border-[#9a7d62] bg-[#9a7d62]/5"
                                  : "border-gray-200 hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
                              )}>
                                <RadioGroupItem
                                  value={PaymentMethod.ONLINE}
                                  id="online"
                                  className="hidden"
                                />
                                <label
                                  htmlFor="online"
                                  className="flex items-center cursor-pointer"
                                >
                                  <CreditCard className="h-4 w-4 text-purple-600 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">Online Payment</span>
                                </label>
                              </div>
                            </RadioGroup>
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
          active && !completed
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
