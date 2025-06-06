import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  PetSize, 
  ServiceType, 
  type BookingFormValues, 
  groomingPrices 
} from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PetDetailsProps {
  form: ReturnType<typeof useFormContext<BookingFormValues>>;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export default function PetDetails({ form, onPrevStep, onNextStep }: PetDetailsProps) {
  // Get current service type to show/hide service-specific fields
  const serviceType = form.watch("serviceType");
  const isGroomingService = serviceType === ServiceType.GROOMING;

  console.log("Current service type:", serviceType);
  console.log("Is grooming service:", isGroomingService);
  console.log("Grooming prices:", groomingPrices);

  // Handle form submission
  const handleContinue = () => {
    console.log("Continue button clicked");
    // Reset any previous errors first
    form.clearErrors();
    
    let isValid = true;
    
    // If grooming service is required and not selected, show error
    if (isGroomingService && !form.getValues("groomingService")) {
      console.log("Grooming service not selected");
      form.setError("groomingService", {
        type: "required",
        message: "Please select a grooming service"
      });
      isValid = false;
    }
    
    // Validate other required fields
    const petName = form.getValues("petName");
    const petBreed = form.getValues("petBreed");
    const petSize = form.getValues("petSize");
    
    if (!petName) {
      form.setError("petName", {
        type: "required",
        message: "Please enter your pet's name"
      });
      isValid = false;
    }
    
    if (!petBreed) {
      form.setError("petBreed", {
        type: "required",
        message: "Please enter your pet's breed"
      });
      isValid = false;
    }
    
    if (!petSize) {
      form.setError("petSize", {
        type: "required",
        message: "Please select your pet's size"
      });
      isValid = false;
    }
    
    // If transport is needed but no pickup address is provided
    if (form.getValues("needsTransport") && !form.getValues("pickupAddress")) {
      form.setError("pickupAddress", {
        type: "required",
        message: "Please provide a pickup address"
      });
      isValid = false;
    }
    
    // Force a trigger to show all errors
    form.trigger().then(() => {
      console.log("Form validation triggered, isValid:", isValid);
      console.log("Form errors:", form.formState.errors);
      
      if (isValid) {
        onNextStep();
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">Tell Us About Your Pet</h3>
      
      <div className="space-y-6">
        {/* Grooming Service Selection - always shown for grooming service type, with explicit check */}
        {serviceType === ServiceType.GROOMING && (
          <FormField
            control={form.control}
            name="groomingService"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grooming Service</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  defaultValue=""
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a grooming service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {groomingPrices.map((option) => (
                      <SelectItem key={option.service} value={option.service}>
                        {option.service} - {option.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
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
                  value={field.value}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <PetSizeOption 
                    value={PetSize.SMALL} 
                    label="Small" 
                    description="Up to 10kg"
                  />
                  <PetSizeOption 
                    value={PetSize.MEDIUM} 
                    label="Medium" 
                    description="10-25kg"
                  />
                  <PetSizeOption 
                    value={PetSize.LARGE} 
                    label="Large" 
                    description="25-40kg"
                  />
                  <PetSizeOption 
                    value={PetSize.GIANT} 
                    label="Giant" 
                    description="40kg+"
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
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="needsTransport"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="block font-montserrat font-medium text-gray-900">
                  Add Transport Service
                </FormLabel>
                <p className="text-sm text-gray-500">
                  I would like to add pick-up/drop-off service
                </p>
              </div>
            </FormItem>
          )}
        />
        
        {/* Show pickup address field when transport is checked */}
        {form.watch("needsTransport") && (
          <FormField
            control={form.control}
            name="pickupAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your complete address for pickup"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
      
      <div className="mt-8 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevStep}
        >
          Back
        </Button>
        <Button
          type="button"
          className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

interface PetSizeOptionProps {
  value: string;
  label: string;
  description: string;
}

function PetSizeOption({ value, label, description }: PetSizeOptionProps) {
  return (
    <div className="relative">
      <RadioGroupItem 
        value={value} 
        id={`pet-size-${value}`}
        className="peer sr-only"
      />
      <label
        htmlFor={`pet-size-${value}`}
        className={cn(
          "flex flex-col items-center justify-center rounded-md border-2 border-gray-200 p-4 cursor-pointer",
          "peer-data-[state=checked]:border-[#9a7d62] peer-data-[state=checked]:bg-[#9a7d62]/5",
          "hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
        )}
      >
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </label>
    </div>
  );
}
