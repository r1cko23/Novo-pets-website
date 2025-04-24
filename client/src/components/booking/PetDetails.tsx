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
import { RadioGroup } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PetSize, type BookingFormValues } from "@shared/schema";

interface PetDetailsProps {
  form: ReturnType<typeof useFormContext<BookingFormValues>>;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export default function PetDetails({ form, onPrevStep, onNextStep }: PetDetailsProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">Tell Us About Your Pet</h3>
      
      <div className="space-y-6">
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
                  <PetSizeOption 
                    value={PetSize.SMALL} 
                    label="Small" 
                    description="Up to 10kg" 
                    checked={field.value === PetSize.SMALL}
                  />
                  <PetSizeOption 
                    value={PetSize.MEDIUM} 
                    label="Medium" 
                    description="10-25kg" 
                    checked={field.value === PetSize.MEDIUM}
                  />
                  <PetSizeOption 
                    value={PetSize.LARGE} 
                    label="Large" 
                    description="25-40kg" 
                    checked={field.value === PetSize.LARGE}
                  />
                  <PetSizeOption 
                    value={PetSize.GIANT} 
                    label="Giant" 
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
          onClick={onNextStep}
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
  checked: boolean;
}

function PetSizeOption({ value, label, description, checked }: PetSizeOptionProps) {
  return (
    <div className={cn(
      "border rounded-md p-3 cursor-pointer text-center",
      checked 
        ? "border-[#9a7d62] bg-[#9a7d62]/5" 
        : "border-gray-200 hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
    )}>
      <input 
        type="radio" 
        name="pet-size" 
        id={value} 
        value={value}
        className="hidden" 
      />
      <label htmlFor={value} className="flex flex-col items-center cursor-pointer">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </label>
    </div>
  );
}
