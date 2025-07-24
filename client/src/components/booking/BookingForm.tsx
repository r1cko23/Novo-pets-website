import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import {
  apiRequest,
  invalidateAvailabilityQueries,
  createReservation,
} from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { format, add, parse } from "date-fns";
import {
  CalendarIcon,
  Check,
  CreditCard,
  Landmark,
  BanknoteIcon,
  Loader2,
  AlertCircle,
  CheckIcon,
} from "lucide-react";
import {
  bookingFormSchema,
  ServiceType,
  PetSize,
  PaymentMethod,
  type BookingFormValues,
  groomingPrices,
} from "@shared/schema";
import { cn, generateTimeSlots, getBookingReference } from "@/lib/utils";
import PetDetails from "./PetDetails";
import { TimeSlot, Reservation } from "@/types/index";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";

// Add these constants near the top of the file, after the imports
// These should match the values used on the server
const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const GROOMERS = ["Groomer 1", "Groomer 2"];

// Extend the BookingFormValues type to include the reservationId
interface BookingFormValuesWithReservation
  extends Omit<BookingFormValues, "groomer"> {
  reservationId?: string;
  groomer?: string; // Make groomer optional string only (no null)
}

// Add a new time format utility function near the top of the file after imports
function normalizeTimeFormat(time: string): string {
  // Remove any AM/PM and spaces, convert to 24-hour format
  if (!time) return "";

  // If time includes AM/PM, convert to 24-hour format
  if (time.toUpperCase().includes("AM") || time.toUpperCase().includes("PM")) {
    const timeStr = time.replace(/\s/g, "").toUpperCase();
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
    if (match) {
      const [_, hourStr, minuteStr, period] = match;
      let hour = parseInt(hourStr, 10);

      // Convert hour based on AM/PM
      if (period === "PM" && hour < 12) {
        hour += 12;
      } else if (period === "AM" && hour === 12) {
        hour = 0;
      }

      // Format hour with leading zero if needed
      const hourFormatted = hour.toString().padStart(2, "0");
      return `${hourFormatted}:${minuteStr}`;
    }
  }

  // If it already has a colon, it's likely in HH:MM format
  if (time.includes(":")) {
    // Ensure it's in the format "HH:MM" by taking first 5 chars
    return time.substring(0, 5);
  }

  // If it's just a number, assume it's hours and add ":00"
  return `${time.padStart(2, "0")}:00`;
}

// Component to display slot availability summary with color-coded indicators
interface AvailabilitySummaryProps {
  date: string;
  isLoading: boolean;
}

function AvailabilitySummary({ date, isLoading }: AvailabilitySummaryProps) {
  const [summary, setSummary] = useState<{
    total: number;
    available: number;
    booked: number;
  }>({
    total: 0,
    available: 0,
    booked: 0,
  });

  // Calculate the availability percentage
  const availabilityPercentage = summary.total
    ? Math.round((summary.available / summary.total) * 100)
    : 0;
  const bookedPercentage = summary.total
    ? Math.round((summary.booked / summary.total) * 100)
    : 0;

  // Get the status color based on availability
  const getStatusColor = () => {
    if (availabilityPercentage <= 20)
      return "bg-red-100 text-red-700 border-red-200";
    if (availabilityPercentage <= 50)
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  // Fetch availability data when date changes
  useEffect(() => {
    if (!date) return;

    const fetchData = async () => {
      try {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        const response = await fetch(`/api/availability?date=${formattedDate}`);
        const data = await response.json();

        if (data.availableTimeSlots) {
          const total = data.availableTimeSlots.length;
          const available = data.availableTimeSlots.filter(
            (slot: { available: boolean }) => slot.available
          ).length;
          const booked = total - available;

          setSummary({ total, available, booked });
        }
      } catch (error) {
        console.error("Error fetching availability summary:", error);
      }
    };

    fetchData();
  }, [date]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading availability...</span>
      </div>
    );
  }

  if (summary.total === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div
        className={`text-sm rounded-md px-3 py-2 border ${getStatusColor()}`}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">Slot Availability:</span>
          <span className="font-semibold">
            {summary.available}/{summary.total} Available
          </span>
        </div>
        <div className="mt-1 bg-white/40 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full ${
              bookedPercentage > 80
                ? "bg-red-500"
                : bookedPercentage > 50
                ? "bg-amber-500"
                : "bg-green-500"
            }`}
            style={{ width: `${bookedPercentage}%` }}
          ></div>
        </div>
        {bookedPercentage >= 70 && (
          <p className="text-xs mt-1.5 font-medium">
            <AlertCircle className="inline h-3 w-3 mr-1" />
            High demand: {bookedPercentage}% of slots already booked
          </p>
        )}
      </div>
    </div>
  );
}

export default function BookingForm() {
  const [step, setStep] = useState(1);
  const [bookingReference, setBookingReference] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedGroomer, setSelectedGroomer] = useState<string | null>(null);
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const reservationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [reservationTimeLeft, setReservationTimeLeft] = useState<number | null>(
    null
  );
  const [showBookedSlots, setShowBookedSlots] = useState(true);
  const [debugDataLoaded, setDebugDataLoaded] = useState(false); // For debugging
  const [lastAvailabilityData, setLastAvailabilityData] = useState<any>(null); // For debugging
  const [timeSlotsByGroomer, setTimeSlotsByGroomer] = useState<
    Record<string, TimeSlot[]>
  >({});
  const [groomersWithSlots, setGroomersWithSlots] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false); // Add the missing state variable
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

  // Get the selected date and time from the form
  const selectedDate = form.watch("appointmentDate");
  const selectedTime = form.watch("appointmentTime");

  // Watch service type to show different form fields
  const serviceType = form.watch("serviceType");

  // Function to check if a date is fully booked
  const checkDateAvailability = async (date: string) => {
    try {
      // Format date directly from the string without timezone issues
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      console.log(`Checking availability for ${formattedDate}`);

      const response = await apiRequest(
        "GET",
        `/api/availability?date=${formattedDate}`
      );
      const data = await response.json();

      return (
        data.availableTimeSlots &&
        data.availableTimeSlots.some(
          (slot: { available: boolean }) => slot.available
        )
      );
    } catch (error) {
      console.error("Error checking date availability:", error);
      return true; // Assume there are slots available in case of error
    }
  };

  // Optimize refetching interval based on page activity
  const [refetchInterval, setRefetchInterval] = useState<number | false>(5000);

  useEffect(() => {
    // Set up visibility change listener to optimize refetch interval
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When page is not visible, reduce polling frequency to save resources
        setRefetchInterval(30000); // 30 seconds when hidden
      } else {
        // When visible, use normal polling frequency
        setRefetchInterval(5000); // 5 seconds when visible
      }
    };

    // Initial setting based on current visibility
    handleVisibilityChange();

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Query to fetch available time slots when date changes
  const {
    data: availabilityData,
    isLoading: isLoadingAvailability,
    refetch: refetchAvailability,
    error: availabilityError,
  } = useQuery({
    queryKey: ["availability", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return { availableTimeSlots: [] };

      try {
        // Add timestamp to prevent caching and force refresh flag
        const timestamp = new Date().getTime();

        // IMPORTANT: Format the date as YYYY-MM-DD without timezone conversion
        // Extract year, month, day directly from the date object to avoid timezone issues
        // Ensure we have a proper Date object
        const dateObject = new Date(selectedDate);
        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, "0");
        const day = String(dateObject.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        console.log(
          `Fetching availability for date: ${formattedDate} (raw date: ${dateObject.toISOString()}, timestamp: ${timestamp})`
        );

        // First try the direct API call with proper error handling
        try {
          // Use fetch directly to have more control over the request
          const response = await fetch(
            `/api/availability?date=${formattedDate}&refresh=true&_=${timestamp}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
              },
            }
          );

          // Get response text first for debugging
          const responseText = await response.text();
          console.log(
            `Raw availability response (${
              response.status
            }): ${responseText.substring(0, 200)}${
              responseText.length > 200 ? "..." : ""
            }`
          );

          // If response isn't OK, log the error but don't throw yet - we'll generate fallback data
          if (!response.ok) {
            console.error(
              `Error fetching availability: ${response.status} ${response.statusText}`
            );
            console.error(`Error response body: ${responseText}`);
          } else {
            // Parse the JSON if we have a valid response
            try {
              const result = JSON.parse(responseText);
              console.log(
                "Successfully parsed availability data:",
                result.success,
                `(${result.availableTimeSlots?.length || 0} slots)`
              );

              // Log the breakdown of available vs. booked slots
              if (
                result.availableTimeSlots &&
                Array.isArray(result.availableTimeSlots)
              ) {
                const availableCount = result.availableTimeSlots.filter(
                  (slot: any) => !!slot.available
                ).length;
                const bookedCount =
                  result.availableTimeSlots.length - availableCount;
                console.log(
                  `Slot stats: ${availableCount} available, ${bookedCount} booked`
                );

                // Check for the specific 9:00 AM slot
                const nineAmSlots = result.availableTimeSlots.filter(
                  (slot: any) => slot.time === "09:00"
                );
                if (nineAmSlots.length > 0) {
                  console.log(
                    "9:00 AM slots status:",
                    nineAmSlots
                      .map(
                        (slot: any) =>
                          `${slot.groomer}: ${
                            slot.available ? "available" : "booked"
                          }`
                      )
                      .join(", ")
                  );
                }
              }

              // Make sure the result has the expected format
              if (
                result.success &&
                result.availableTimeSlots &&
                Array.isArray(result.availableTimeSlots)
              ) {
                // Format the time slots for display
                const formattedTimeSlots = result.availableTimeSlots.map(
                  (slot: {
                    time: string;
                    groomer: string;
                    available: boolean;
                  }) => ({
                    ...slot,
                    // Ensure time is in HH:00 format
                    time: slot.time.includes(":")
                      ? slot.time
                      : `${slot.time}:00`,
                    // Format for display
                    formattedTime: format(
                      parse(
                        slot.time.includes(":") ? slot.time : `${slot.time}:00`,
                        "HH:mm",
                        new Date()
                      ),
                      "h:mm a"
                    ),
                    // Ensure available is boolean type
                    available: !!slot.available,
                  })
                );

                return {
                  success: true,
                  availableTimeSlots: formattedTimeSlots,
                  source: "api",
                };
              }
            } catch (parseError) {
              console.error("Failed to parse availability JSON:", parseError);
            }
          }
        } catch (fetchError) {
          console.error("Network error fetching availability:", fetchError);
        }

        // If we reach here, something went wrong with the API call or parsing
        // Generate fallback data with all slots available
        console.warn("Using fallback availability data");

        const fallbackTimeSlots = TIME_SLOTS.flatMap((time) =>
          GROOMERS.map((groomer) => ({
            time,
            groomer,
            available: true,
            formattedTime: format(parse(time, "HH:mm", new Date()), "h:mm a"),
          }))
        );

        return {
          success: true,
          availableTimeSlots: fallbackTimeSlots,
          source: "fallback",
        };
      } catch (error) {
        // This is a catch-all for any other unexpected errors
        console.error("Unexpected error in availability query:", error);

        // Always show an error toast to the user
        toast({
          title: "Availability Error",
          description:
            "Unable to fetch time slots. Please try again or select another date.",
          variant: "destructive",
        });

        // Return empty data rather than throwing
        return {
          success: false,
          availableTimeSlots: [],
          source: "error",
        };
      }
    },
    enabled: !!selectedDate, // Only run query when a date is selected
    staleTime: 0, // Consider data always stale, force refetch every time
    gcTime: 1000 * 30, // Cache for 30 seconds
    refetchOnMount: "always", // Always refetch when the component mounts
    refetchOnWindowFocus: true, // Refetch when the window regains focus
    refetchInterval: refetchInterval, // Dynamic refetch interval
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Handle reservation creation when time and groomer are selected
  useEffect(() => {
    const makeReservation = async () => {
      if (selectedDate && selectedTime && selectedGroomer) {
        // Clear any existing reservation and timer
        if (reservationTimerRef.current) {
          clearInterval(reservationTimerRef.current);
          reservationTimerRef.current = null;
        }

        // Normalize the selected time for consistent comparison
        const normalizedTime = normalizeTimeFormat(selectedTime);

        // Check if the current time matches our existing reservation
        if (
          reservation &&
          reservation.date === selectedDate &&
          normalizeTimeFormat(reservation.time) === normalizedTime &&
          reservation.groomer === selectedGroomer
        ) {
          // We already have a valid reservation for this slot
          return;
        }

        // Create a new reservation
        try {
          console.log(
            `Creating reservation for ${selectedDate} at ${normalizedTime} (from ${selectedTime}) with ${selectedGroomer}`
          );
          const result = await createReservation(
            selectedDate,
            normalizedTime, // Use normalized time
            selectedGroomer
          );

          if (result) {
            const expiresAt = add(new Date(), { seconds: result.expiresIn });

            setReservation({
              id: result.reservationId,
              expiresAt,
              date: selectedDate,
              time: normalizedTime, // Store normalized time
              groomer: selectedGroomer,
            });

            // Start a timer to update the time left display
            if (reservationTimerRef.current) {
              clearInterval(reservationTimerRef.current);
            }

            reservationTimerRef.current = setInterval(() => {
              const now = new Date();
              const timeLeft = Math.floor(
                (expiresAt.getTime() - now.getTime()) / 1000
              );

              if (timeLeft <= 0) {
                // Reservation expired
                setReservation(null);
                setReservationTimeLeft(null);
                if (reservationTimerRef.current) {
                  clearInterval(reservationTimerRef.current);
                  reservationTimerRef.current = null;
                }

                // Refresh availability
                refetchAvailability();

                // Notify user
                toast({
                  title: "Reservation Expired",
                  description:
                    "Your time slot reservation has expired. Please select a time slot again.",
                  variant: "destructive",
                });
              } else {
                setReservationTimeLeft(timeLeft);
              }
            }, 1000);
          }
        } catch (error) {
          console.error("Failed to create reservation", error);

          // Handle already booked slot errors specifically
          if (
            error instanceof Error &&
            ((error as any).isSlotUnavailable ||
              error.message?.includes("already booked") ||
              error.message?.includes("not available"))
          ) {
            // Extract slot info
            const slotInfo = (error as any).slotInfo || {
              date: selectedDate,
              time: normalizedTime,
              groomer: selectedGroomer,
            };

            // Mark this slot as booked in the UI and localStorage for persistence
            markSlotAsBooked(slotInfo.time, slotInfo.groomer);

            // Force refresh availability data
            refetchAvailability();

            // Notify user
            toast({
              title: "Time Slot Unavailable",
              description:
                "This time slot has already been booked. Please select another time.",
              variant: "destructive",
            });

            // Reset selected time
            form.setValue("appointmentTime", "");
          }
        }
      }
    };

    makeReservation();

    // Clean up timer on unmount
    return () => {
      if (reservationTimerRef.current) {
        clearInterval(reservationTimerRef.current);
      }
    };
  }, [selectedDate, selectedTime, selectedGroomer]);

  // Update available time slots when data changes
  useEffect(() => {
    if (availabilityData?.availableTimeSlots) {
      // Explicitly type the data coming from the API
      const typedTimeSlots: TimeSlot[] =
        availabilityData.availableTimeSlots.map((slot: any) => ({
          ...slot,
          // Normalize time format to ensure consistent comparison
          time: normalizeTimeFormat(slot.time),
          formattedTime:
            slot.formattedTime ||
            format(
              parse(normalizeTimeFormat(slot.time), "HH:mm", new Date()),
              "h:mm a"
            ),
          // Ensure available is boolean type
          available: !!slot.available,
        }));

      console.log(
        "Setting available time slots with normalized formats:",
        typedTimeSlots
      );

      // DEBUG: Check the 'available' property on each slot
      const availableCount = typedTimeSlots.filter(
        (slot) => !!slot.available
      ).length;
      const bookedCount = typedTimeSlots.length - availableCount;
      console.log(
        `DEBUG: Time slot availability processing: ${availableCount} available, ${bookedCount} booked`
      );

      // For debugging, save the availability data
      setLastAvailabilityData(availabilityData);
      setDebugDataLoaded(true);

      // Specifically check 9:00 AM slots with normalized format
      const nineAmSlots = typedTimeSlots.filter(
        (slot) => normalizeTimeFormat(slot.time) === "09:00"
      );
      if (nineAmSlots.length > 0) {
        console.log(
          "9:00 AM slot status with normalized format:",
          nineAmSlots
            .map(
              (slot) =>
                `${slot.groomer}: ${
                  !!slot.available ? "AVAILABLE" : "BOOKED"
                } (time=${slot.time})`
            )
            .join(", ")
        );
      }

      // Set all available slots (both available and unavailable)
      setAvailableTimeSlots(typedTimeSlots);

      // Reset the time selection if the previously selected time is no longer available
      const currentTime = form.getValues("appointmentTime");
      const currentGroomer = selectedGroomer;

      if (currentTime && currentGroomer) {
        const normalizedCurrentTime = normalizeTimeFormat(currentTime);
        const isStillAvailable = typedTimeSlots.some(
          (slot) =>
            normalizeTimeFormat(slot.time) === normalizedCurrentTime &&
            slot.groomer === currentGroomer &&
            !!slot.available === true
        );

        if (!isStillAvailable) {
          // Don't reset if we have a valid reservation for this slot
          if (
            !reservation ||
            reservation.date !== selectedDate ||
            reservation.time !== currentTime ||
            reservation.groomer !== currentGroomer
          ) {
            form.setValue("appointmentTime", "");
            setReservation(null);

            toast({
              title: "Time slot no longer available",
              description:
                "The time slot you selected is no longer available. Please select another time.",
              variant: "destructive",
            });
          }
        }
      }
    } else {
      // Clear available time slots if no data is available
      setAvailableTimeSlots([]);
      setDebugDataLoaded(false);
    }
  }, [availabilityData, form, selectedGroomer, reservation, selectedDate]);

  // Track availability statistics per time
  const [timeSlotAvailability, setTimeSlotAvailability] = useState<
    Record<string, { totalSlots: number; available: number }>
  >({});

  // Process availability data when it changes
  useEffect(() => {
    if (
      availabilityData?.availableTimeSlots &&
      Array.isArray(availabilityData.availableTimeSlots)
    ) {
      // Clear the existing data
      const newTimeSlotsByGroomer: Record<string, TimeSlot[]> = {};
      const newGroomersWithSlots: string[] = [];

      // Track availability statistics per time
      const timeStats: Record<
        string,
        { totalSlots: number; available: number }
      > = {};

      // Group time slots by groomer
      availabilityData.availableTimeSlots.forEach((slot) => {
        // Skip if the slot doesn't have expected properties
        if (!slot || !slot.time || !slot.groomer) return;

        // Create groomer entry if it doesn't exist yet
        if (!newTimeSlotsByGroomer[slot.groomer]) {
          newTimeSlotsByGroomer[slot.groomer] = [];
          newGroomersWithSlots.push(slot.groomer);
        }

        // Add the slot to the groomer's list
        newTimeSlotsByGroomer[slot.groomer].push(slot);

        // Track availability stats per time slot
        if (!timeStats[slot.time]) {
          timeStats[slot.time] = { totalSlots: 0, available: 0 };
        }
        timeStats[slot.time].totalSlots++;
        if (slot.available) {
          timeStats[slot.time].available++;
        }
      });

      // Update the state
      setTimeSlotAvailability(timeStats);

      // Sort each groomer's time slots
      Object.keys(newTimeSlotsByGroomer).forEach((groomer) => {
        newTimeSlotsByGroomer[groomer].sort((a, b) => {
          return a.time.localeCompare(b.time);
        });
      });

      // Update the state variables
      setTimeSlotsByGroomer(newTimeSlotsByGroomer);
      setGroomersWithSlots(newGroomersWithSlots);

      console.log(
        `Updated state: ${newGroomersWithSlots.length} groomers with time slots`
      );

      // Check if there are any available slots at all
      const anyAvailableSlots = availabilityData.availableTimeSlots.some(
        (slot) => slot.available
      );
      if (!anyAvailableSlots && selectedDate) {
        // If there are no available slots, add this date to the fully booked dates
        setFullyBookedDates((prev) => {
          if (!prev.includes(selectedDate)) {
            return [...prev, selectedDate];
          }
          return prev;
        });
      }
    } else {
      // Clear the structures when there's no data
      setTimeSlotsByGroomer({});
      setGroomersWithSlots([]);
    }
  }, [availabilityData, selectedDate]);

  // Mutation for submitting form
  const mutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      // Make sure the groomer is included in the booking data only for grooming service
      if (data.serviceType === ServiceType.GROOMING && !selectedGroomer) {
        throw new Error("Groomer must be selected");
      }

      const bookingData: BookingFormValuesWithReservation = {
        ...data,
        groomer:
          data.serviceType === ServiceType.GROOMING
            ? selectedGroomer || undefined
            : undefined,
      };

      // Include reservation ID if we have one
      if (
        reservation &&
        reservation.date === selectedDate &&
        reservation.time === selectedTime &&
        reservation.groomer === selectedGroomer
      ) {
        bookingData.reservationId = reservation.id;
      }

      console.log("Submitting booking with data:", bookingData);

      const response = await apiRequest("POST", "/api/bookings", bookingData);

      if (!response.ok) {
        let errorMessage = "Failed to book appointment";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore JSON parsing error
        }
        throw new Error(errorMessage);
      }

      // Parse response JSON safely
      try {
        return await response.json();
      } catch (e) {
        console.error("Error parsing booking response:", e);
        // Return a minimal success response if JSON parsing fails
        return { success: true };
      }
    },
    onSuccess: (data) => {
      // After successful booking, invalidate and refetch availability data
      // to make sure it's updated for all users
      if (selectedDate) {
        // Format date directly without timezone issues
        const dateObj = new Date(selectedDate);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        console.log(
          `Invalidating availability queries for date: ${formattedDate}`
        );
        invalidateAvailabilityQueries(formattedDate);
      } else {
        invalidateAvailabilityQueries();
      }

      // Clear the reservation
      setReservation(null);
      if (reservationTimerRef.current) {
        clearInterval(reservationTimerRef.current);
        reservationTimerRef.current = null;
      }

      // Also force a direct refetch
      refetchAvailability();

      setBookingReference(getBookingReference());
      setStep(5); // Move to confirmation step
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully scheduled. A confirmation email has been sent to your email address.",
      });
    },
    onError: (error) => {
      // Check if the error message contains information about an unavailable time slot
      const errorMessage =
        error instanceof Error ? error.message : "Please try again";
      if (
        errorMessage.includes("not available") ||
        errorMessage.includes("already booked") ||
        errorMessage.includes("reservation")
      ) {
        // Reset the time selection since it's no longer available
        form.setValue("appointmentTime", "");
        setReservation(null);

        // If we know which time slot was attempted, manually mark it as unavailable in the UI
        // to provide immediate feedback
        const attemptedTime = form.getValues("appointmentTime");
        const attemptedGroomer = selectedGroomer;

        if (
          attemptedTime &&
          attemptedGroomer &&
          availableTimeSlots.length > 0
        ) {
          // Update the local state to mark this slot as unavailable
          const updatedTimeSlots = availableTimeSlots.map((slot) => {
            if (
              slot.time === attemptedTime &&
              slot.groomer === attemptedGroomer
            ) {
              return { ...slot, available: false };
            }
            return slot;
          });

          setAvailableTimeSlots(updatedTimeSlots);
          console.log(
            `Manually marked slot ${attemptedTime} for ${attemptedGroomer} as unavailable`
          );
        }

        // Use a more aggressive approach to refresh availability data
        if (selectedDate) {
          // Format date directly without timezone issues
          const dateObj = new Date(selectedDate);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const formattedDate = `${year}-${month}-${day}`;

          console.log(
            `Invalidating availability queries for date after error: ${formattedDate}`
          );

          // Invalidate the cache for this date
          invalidateAvailabilityQueries(formattedDate);

          // Force an immediate refetch with a unique timestamp to bypass any caching
          setTimeout(() => {
            refetchAvailability();
          }, 100);
        }

        toast({
          title: "Time Slot Unavailable",
          description:
            "This time slot has just been booked by someone else. Please select another time.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Booking Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    // Only require groomer for grooming service, not hotel stays
    if (data.serviceType === ServiceType.GROOMING && !selectedGroomer) {
      toast({
        title: "Missing Groomer",
        description: "Please select a groomer before confirming your booking.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(data);
  };

  const nextStep = () => {
    console.log("Next step button clicked, current step:", step);
    console.log("Current service type:", serviceType);
    console.log("Form values:", form.getValues());

    const fieldsByStep = {
      1: ["serviceType"],
      2: ["appointmentDate", "appointmentTime"],
      3: ["petName", "petBreed", "petSize"],
      4: ["customerName", "customerPhone", "customerEmail"],
    };

    const currentStepFields =
      fieldsByStep[step as keyof typeof fieldsByStep] || [];

    // Validate only the fields for the current step
    const validateFields = async () => {
      console.log(`Validating fields for step ${step}`);

      // First validation step - service selection
      if (step === 1) {
        if (
          serviceType === ServiceType.HOTEL &&
          !form.getValues("accommodationType")
        ) {
          form.setError("accommodationType", {
            type: "required",
            message: "Please select an accommodation type",
          });
          return false;
        }

        return true;
      }
      // Second validation step - date and time
      else if (step === 2) {
        if (!form.getValues("appointmentDate")) {
          form.setError("appointmentDate", {
            type: "required",
            message: "Please select a date",
          });
          return false;
        }

        if (
          serviceType !== ServiceType.HOTEL &&
          !form.getValues("appointmentTime")
        ) {
          form.setError("appointmentTime", {
            type: "required",
            message: "Please select a time",
          });
          return false;
        }

        return true;
      }
      // Third validation step - pet details
      else if (step === 3) {
        const petFields = ["petName", "petBreed", "petSize"];
        let isValid = true;

        // Check if grooming service is selected when serviceType is GROOMING
        if (
          serviceType === ServiceType.GROOMING &&
          !form.getValues("groomingService")
        ) {
          console.log("Grooming service is required but not selected");
          form.setError("groomingService", {
            type: "required",
            message: "Please select a grooming service",
          });
          isValid = false;
        }

        // Validate required pet fields
        for (const field of petFields) {
          if (!form.getValues(field as keyof BookingFormValues)) {
            form.setError(field as any, {
              type: "required",
              message: `Please enter your pet's ${field
                .replace("pet", "")
                .toLowerCase()}`,
            });
            isValid = false;
          }
        }

        // Check if transport is needed but no address provided
        if (
          form.getValues("needsTransport") &&
          !form.getValues("pickupAddress")
        ) {
          form.setError("pickupAddress", {
            type: "required",
            message: "Please provide your pickup address",
          });
          isValid = false;
        }

        return isValid;
      }
      // Fourth validation step - customer details
      else if (step === 4) {
        const customerFields = [
          "customerName",
          "customerPhone",
          "customerEmail",
          "paymentMethod",
        ];
        let isValid = true;

        for (const field of customerFields) {
          if (!form.getValues(field as keyof BookingFormValues)) {
            form.setError(field as any, {
              type: "required",
              message: `Please provide your ${field
                .replace("customer", "")
                .toLowerCase()}`,
            });
            isValid = false;
          }
        }

        return isValid;
      }

      return true;
    };

    validateFields().then((result) => {
      if (result) {
        setStep((prev) => prev + 1);
      }
    });
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  // Function to display all possible time slots, including booked ones
  const getTimeSlotDisplay = (groomer: string) => {
    if (
      !timeSlotsByGroomer[groomer] ||
      timeSlotsByGroomer[groomer].length === 0
    ) {
      return (
        <div className="p-4 text-center text-gray-500">
          No time slots available for {groomer}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3">
        {timeSlotsByGroomer[groomer].map((slot) => {
          const isSelected =
            selectedTime === slot.time && selectedGroomer === slot.groomer;

          // Skip booked slots if showBookedSlots is false
          if (!showBookedSlots && !slot.available) {
            return null;
          }

          return (
            <label
              key={`${slot.groomer}-${slot.time}`}
              className={cn(
                "relative flex cursor-pointer rounded-lg p-3 shadow-sm border text-center items-center justify-center transition-all",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary"
                  : slot.available
                  ? "border-gray-200 bg-white hover:bg-gray-50"
                  : "border-red-200 bg-red-100 text-red-800 cursor-not-allowed"
              )}
            >
              <input
                type="radio"
                name="time-slot"
                value={slot.time}
                disabled={!slot.available}
                className="sr-only"
                onChange={() => {
                  if (slot.available) {
                    form.setValue("appointmentTime", slot.time);
                    setSelectedGroomer(slot.groomer);
                  }
                }}
              />
              <span className="flex flex-col">
                {slot.formattedTime ||
                  format(
                    parse(normalizeTimeFormat(slot.time), "HH:mm", new Date()),
                    "h:mm a"
                  )}
                {!slot.available && (
                  <span className="font-bold text-sm mt-1 text-red-600">
                    BOOKED
                  </span>
                )}
              </span>
              {isSelected && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                  <CheckIcon className="h-3 w-3 text-white" />
                </span>
              )}
            </label>
          );
        })}
      </div>
    );
  };

  // Format the remaining reservation time
  const formatReservationTime = (seconds: number | null) => {
    if (seconds === null) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // For hotel stays, we need to handle check-in and check-out dates differently
  useEffect(() => {
    // Reset some fields when service type changes
    if (serviceType === ServiceType.HOTEL) {
      // Set default values for hotel stays
      form.setValue(
        "accommodationType",
        form.getValues("accommodationType") || "Standard"
      );
      form.setValue("durationDays", form.getValues("durationDays") || 1);

      // For hotel stays, we don't need a groomer
      form.setValue("groomer", "");

      // Set default check-in time for hotel
      if (!form.getValues("appointmentTime")) {
        form.setValue("appointmentTime", "12:00");
      }
    } else {
      // Reset hotel-specific fields
      form.setValue("accommodationType", "");
      form.setValue("durationDays", undefined);
    }
  }, [serviceType, form]);

  // Add a function to force refresh availability data
  const forceRefreshAvailability = async () => {
    if (!selectedDate) return;

    setIsRefreshing(true);

    try {
      const dateObj = new Date(selectedDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      // Add a timestamp and forceRefresh parameter to bypass cache
      const timestamp = Date.now();
      const response = await fetch(
        `/api/availability?date=${formattedDate}&forceRefresh=true&_=${timestamp}`
      );

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.availableTimeSlots) {
        // Clear local storage cache for this date
        const localStorageKey = `booked_slots_${formattedDate}`;
        localStorage.removeItem(localStorageKey);

        // Log specific information about 9:00 AM slots for debugging
        const nineAmSlots = data.availableTimeSlots.filter(
          (slot: any) => normalizeTimeFormat(slot.time) === "09:00"
        );

        if (nineAmSlots.length > 0) {
          console.log(
            "9:00 AM slots after force refresh:",
            nineAmSlots
              .map(
                (slot: any) =>
                  `${slot.groomer}: ${slot.available ? "AVAILABLE" : "BOOKED"}`
              )
              .join(", ")
          );
        }

        // Update the UI with fresh data
        refetchAvailability();

        // Show success toast
        toast({
          title: "Availability Updated",
          description:
            "Appointment availability has been refreshed with the latest data.",
        });
      }
    } catch (error) {
      console.error("Error force refreshing availability:", error);

      toast({
        title: "Refresh Failed",
        description: "Could not refresh availability data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add this code at the beginning of the component where other useEffect hooks are defined:

  // Force refresh availability data whenever the date or groomer changes
  useEffect(() => {
    if (selectedDate) {
      console.log(
        `Date changed, refreshing availability data for ${selectedDate}`
      );
      refetchAvailability();
    }
  }, [selectedDate, refetchAvailability]);

  // Force refresh availability data whenever the groomer selection changes
  useEffect(() => {
    if (selectedGroomer && selectedDate) {
      console.log(
        `Groomer changed to ${selectedGroomer}, refreshing availability data`
      );
      refetchAvailability();
    }
  }, [selectedGroomer, selectedDate, refetchAvailability]);

  // Utility function to get availability summary for a date
  const getAvailabilitySummary = async (
    date: Date
  ): Promise<{ total: number; available: number; booked: number }> => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const response = await fetch(`/api/availability?date=${formattedDate}`);
      const data = await response.json();

      if (data.availableTimeSlots) {
        const total = data.availableTimeSlots.length;
        const available = data.availableTimeSlots.filter(
          (slot: TimeSlot) => slot.available
        ).length;
        const booked = total - available;

        return { total, available, booked };
      }
    } catch (error) {
      console.error("Error getting availability summary:", error);
    }

    return { total: 0, available: 0, booked: 0 };
  };

  // Add this function to pre-check if a specific slot is known to be booked in the UI
  const isSlotKnownBooked = (time: string, groomer: string): boolean => {
    try {
      // Normalize time for consistent comparison
      const normalizedTime = normalizeTimeFormat(time);

      // First check the server data
      const slot = availableTimeSlots.find(
        (s) =>
          normalizeTimeFormat(s.time) === normalizedTime &&
          s.groomer === groomer
      );

      if (slot) {
        return !slot.available; // If we have data for this slot, use its availability state
      }

      // If we don't have server data yet, check if we've seen a booking error for this slot
      const errorKey = `${selectedDate}:${normalizedTime}:${groomer}`;
      return localStorage.getItem(`booked_slot:${errorKey}`) === "true";
    } catch (e) {
      console.error("Error checking if slot is known booked:", e);
      return false;
    }
  };

  // Function to mark a specific slot as booked
  const markSlotAsBooked = (time: string, groomer: string) => {
    try {
      // Normalize time for consistent comparison
      const normalizedTime = normalizeTimeFormat(time);

      // Update local storage to remember this slot is booked
      const errorKey = `${selectedDate}:${normalizedTime}:${groomer}`;
      localStorage.setItem(`booked_slot:${errorKey}`, "true");

      // Update the UI
      setAvailableTimeSlots((prevSlots) =>
        prevSlots.map((slot) => {
          if (
            normalizeTimeFormat(slot.time) === normalizedTime &&
            slot.groomer === groomer
          ) {
            return { ...slot, available: false };
          }
          return slot;
        })
      );

      console.log(`Manually marked slot ${time} with ${groomer} as booked`);
    } catch (e) {
      console.error("Error marking slot as booked:", e);
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg w-full max-w-4xl mx-auto my-8">
      <div className="md:flex">
        {/* Left sidebar with steps */}
        <div className="md:w-1/3 bg-[#9a7d62] p-8 text-white">
          <h3 className="font-playfair text-2xl font-bold mb-4">
            How It Works
          </h3>
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
            <h4 className="font-montserrat font-semibold mb-2">
              Operating Hours
            </h4>
            <p className="text-sm opacity-80">9 AM - 6 PM (Last Call: 5 PM)</p>
            <p className="text-sm opacity-80 mt-4">Need help? Contact us at:</p>
            <p className="font-medium mt-1">(0917) 791 7671</p>
          </div>
        </div>

        {/* Main form content */}
        <div className="md:w-2/3 p-8">
          {/* Prominent booking advisory */}
          <Alert className="mb-6 bg-blue-50 border-blue-200 shadow-sm">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <AlertTitle className="text-blue-700 font-medium">
                  Important Booking Information
                </AlertTitle>
                <AlertDescription className="text-blue-600">
                  To see accurate availability, please select your preferred
                  date and groomer. Red time slots indicate already booked or
                  unavailable times.
                </AlertDescription>
              </div>
            </div>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Service Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">
                    Select a Service
                  </h3>

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

                  {/* Only show hotel-specific options */}
                  {serviceType === ServiceType.HOTEL && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="accommodationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accommodation Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "Standard"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select accommodation type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Standard">
                                  Standard Room (₱1,000+/day)
                                </SelectItem>
                                <SelectItem value="Owner's Cage">
                                  Owner's Cage (₱850+/day)
                                </SelectItem>
                                <SelectItem value="Luxury Suite">
                                  Luxury Suite (₱1,400+/day)
                                </SelectItem>
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
                            <FormLabel>Duration (Days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="30"
                                value={field.value || 1}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 1)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

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
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">
                    Choose Date & Time
                  </h3>

                  {/* Debug info - only visible during development */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="bg-gray-100 p-2 text-xs text-gray-500 rounded">
                      <div>
                        Debug: {debugDataLoaded ? "Data loaded" : "No data"}
                      </div>
                      <div>
                        Groomers:{" "}
                        {groomersWithSlots.length > 0
                          ? groomersWithSlots.join(", ")
                          : "None"}
                      </div>
                      <div>
                        Slots:{" "}
                        {Object.keys(timeSlotsByGroomer).length > 0
                          ? Object.keys(timeSlotsByGroomer)
                              .map(
                                (g) =>
                                  `${g}(${timeSlotsByGroomer[g]?.length || 0})`
                              )
                              .join(", ")
                          : "None"}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="appointmentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col w-full">
                          <FormLabel className="mb-2">
                            {serviceType === ServiceType.HOTEL
                              ? "Check-in Date"
                              : "Appointment Date"}
                          </FormLabel>
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={async (date) => {
                                  if (date) {
                                    const dateString = date.toISOString();
                                    field.onChange(dateString);

                                    // Force refetch the availability data for this date
                                    await refetchAvailability();

                                    // Check availability for the selected date
                                    const hasAvailability =
                                      await checkDateAvailability(dateString);
                                    if (!hasAvailability) {
                                      toast({
                                        title: "No Available Slots",
                                        description:
                                          "All appointments for this date are booked. Please select another date.",
                                        variant: "destructive",
                                      });
                                    }

                                    // Reset time when date changes
                                    if (serviceType !== ServiceType.HOTEL) {
                                      form.setValue("appointmentTime", "");
                                      form.setValue("groomer", "");
                                      setSelectedGroomer(null);
                                    } else {
                                      // For hotel stays, set default check-in time
                                      form.setValue("appointmentTime", "12:00");
                                    }
                                  } else {
                                    field.onChange("");
                                  }
                                }}
                                disabled={(date) => {
                                  // Disable past dates and Sundays
                                  return (
                                    date <
                                      new Date(
                                        new Date().setHours(0, 0, 0, 0)
                                      ) || date.getDay() === 0
                                  );
                                }}
                                modifiers={{
                                  fullyBooked: (date) => {
                                    // Convert the date to a string to match with fully booked dates
                                    const dateStr = date.toISOString();
                                    return fullyBookedDates.some(
                                      (bookedDate) =>
                                        dateStr.split("T")[0] ===
                                        new Date(bookedDate)
                                          .toISOString()
                                          .split("T")[0]
                                    );
                                  },
                                }}
                                modifiersClassNames={{
                                  fullyBooked:
                                    "text-red-500 line-through bg-red-50/50",
                                }}
                                initialFocus
                              />
                              <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
                                <p className="text-xs font-medium text-gray-500">
                                  Date Legend:
                                </p>
                                <div className="flex flex-col gap-1.5 text-xs">
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-sm bg-white border border-gray-200 mr-2"></div>
                                    <span>Available</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-sm bg-red-50/50 text-red-500 flex items-center justify-center text-[10px] line-through mr-2">
                                      <span>1</span>
                                    </div>
                                    <span>Fully Booked</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-sm bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] mr-2">
                                      <span>1</span>
                                    </div>
                                    <span>Past Date or Sunday (Closed)</span>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          {field.value && (
                            <AvailabilitySummary
                              date={format(new Date(field.value), "yyyy-MM-dd")}
                              isLoading={isLoadingAvailability}
                            />
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {serviceType === ServiceType.HOTEL ? (
                      // For hotel stays, we only need to show the expected checkout date based on duration
                      <div className="mt-4">
                        <FormLabel>Expected Check-out Date</FormLabel>
                        <div className="p-3 border rounded-md text-gray-700 mt-2">
                          {selectedDate && form.watch("durationDays")
                            ? format(
                                add(new Date(selectedDate), {
                                  days: form.watch("durationDays"),
                                }),
                                "PPP"
                              )
                            : "Select check-in date and duration first"}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Check-out time is 12:00 PM. Additional fees may apply
                          for late check-out.
                        </p>
                      </div>
                    ) : (
                      // For grooming services, show groomer selection and time slots
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
                                disabled={
                                  !selectedDate || isLoadingAvailability
                                }
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
                                      <SelectValue
                                        placeholder={
                                          selectedDate
                                            ? "Select a groomer"
                                            : "First select a date"
                                        }
                                      />
                                    )}
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {groomersWithSlots.length > 0 ? (
                                    groomersWithSlots.map((groomer) => {
                                      // Calculate available slots for this groomer
                                      const groomerSlots =
                                        timeSlotsByGroomer[groomer] || [];
                                      const availableSlots =
                                        groomerSlots.filter(
                                          (slot) => slot.available
                                        ).length;
                                      const totalSlots = groomerSlots.length;
                                      // Calculate availability percentage
                                      const availabilityPercentage = totalSlots
                                        ? (availableSlots / totalSlots) * 100
                                        : 0;
                                      const bookedPercentage =
                                        100 - availabilityPercentage;

                                      return (
                                        <SelectItem
                                          key={groomer}
                                          value={groomer}
                                        >
                                          <div className="flex flex-col w-full">
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium">
                                                {groomer}
                                              </span>
                                              <span
                                                className={cn(
                                                  "text-xs ml-2 px-2 py-0.5 rounded-full font-medium",
                                                  availabilityPercentage === 0
                                                    ? "bg-red-100 text-red-700"
                                                    : availabilityPercentage <
                                                      30
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-green-100 text-green-700"
                                                )}
                                              >
                                                {availableSlots}/{totalSlots}{" "}
                                                available
                                              </span>
                                            </div>
                                            {/* Show availability progress bar */}
                                            <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                              <div
                                                className={cn(
                                                  "h-full",
                                                  bookedPercentage > 70
                                                    ? "bg-red-500"
                                                    : bookedPercentage > 40
                                                    ? "bg-amber-500"
                                                    : "bg-green-500"
                                                )}
                                                style={{
                                                  width: `${bookedPercentage}%`,
                                                }}
                                              ></div>
                                            </div>
                                          </div>
                                        </SelectItem>
                                      );
                                    })
                                  ) : (
                                    <div className="px-4 py-6 text-center">
                                      {selectedDate &&
                                      !isLoadingAvailability ? (
                                        <div className="flex flex-col items-center">
                                          <p className="text-sm text-red-500 font-semibold">
                                            No available slots for this date
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            Please select another date
                                          </p>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-500">
                                          Please select a date first
                                        </p>
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
                    )}
                  </div>

                  {serviceType !== ServiceType.HOTEL && (
                    <FormField
                      control={form.control}
                      name="appointmentTime"
                      render={({ field }) => (
                        <FormItem className="w-full mt-6">
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel>Available Times</FormLabel>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  id="show-booked"
                                  checked={showBookedSlots}
                                  onCheckedChange={(checked) =>
                                    setShowBookedSlots(!!checked)
                                  }
                                  className="h-3 w-3"
                                />
                                <Label
                                  htmlFor="show-booked"
                                  className="text-xs text-gray-500"
                                >
                                  {showBookedSlots ? "Hiding" : "Show"} booked
                                  slots
                                </Label>
                              </div>
                              {selectedDate && selectedGroomer && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/10"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    forceRefreshAvailability();
                                  }}
                                  disabled={isLoadingAvailability}
                                >
                                  {isLoadingAvailability ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
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
                                  )}
                                  Refresh Availability
                                </Button>
                              )}
                            </div>
                          </div>

                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={
                              !selectedDate ||
                              !selectedGroomer ||
                              isLoadingAvailability
                            }
                            onOpenChange={(open) => {
                              // Refetch availability data when the dropdown is opened
                              if (open && selectedDate) {
                                // Force a fresh refetch to ensure we have the latest availability
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
                                  <SelectValue
                                    placeholder={
                                      selectedGroomer
                                        ? "Select a time slot"
                                        : "First select a groomer"
                                    }
                                  />
                                )}
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedGroomer ? (
                                // Check if there are any slots at all
                                timeSlotsByGroomer[selectedGroomer]?.length >
                                0 ? (
                                  // Map through and display the slots, filtering based on showBookedSlots
                                  timeSlotsByGroomer[selectedGroomer]
                                    .filter(
                                      (slot) =>
                                        showBookedSlots ||
                                        (slot.available === true &&
                                          !isSlotKnownBooked(
                                            slot.time,
                                            slot.groomer
                                          ))
                                    )
                                    .map((slot) => (
                                      <SelectItem
                                        key={`${slot.time}-${slot.groomer}`}
                                        value={slot.time}
                                        disabled={
                                          !slot.available ||
                                          isSlotKnownBooked(
                                            slot.time,
                                            slot.groomer
                                          )
                                        }
                                        className={cn(
                                          "flex items-center py-2 px-2 relative",
                                          (!slot.available ||
                                            isSlotKnownBooked(
                                              slot.time,
                                              slot.groomer
                                            )) &&
                                            "opacity-90 bg-red-50 border-l-4 border-red-400"
                                        )}
                                      >
                                        <div className="flex justify-between w-full items-center">
                                          <div className="flex items-center">
                                            <span
                                              className={cn(
                                                "text-base",
                                                (slot.available !== true ||
                                                  isSlotKnownBooked(
                                                    slot.time,
                                                    slot.groomer
                                                  )) &&
                                                  "line-through text-gray-400"
                                              )}
                                            >
                                              {slot.formattedTime ||
                                                format(
                                                  parse(
                                                    normalizeTimeFormat(
                                                      slot.time
                                                    ),
                                                    "HH:mm",
                                                    new Date()
                                                  ),
                                                  "h:mm a"
                                                )}
                                            </span>
                                          </div>
                                          {/* Check for booked slots both via slot.available and our manual check */}
                                          {(slot.available !== true ||
                                            isSlotKnownBooked(
                                              slot.time,
                                              slot.groomer
                                            )) && (
                                            <span className="text-white text-xs font-bold px-2 py-1 bg-red-500 rounded-full ml-2 flex items-center">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="mr-1"
                                              >
                                                <path d="M18 6 6 18"></path>
                                                <path d="m6 6 12 12"></path>
                                              </svg>
                                              BOOKED
                                            </span>
                                          )}
                                          {slot.available === true &&
                                            !isSlotKnownBooked(
                                              slot.time,
                                              slot.groomer
                                            ) && (
                                              <span className="text-green-600 text-xs font-semibold px-2 py-1 bg-green-50 rounded-full ml-2 flex items-center">
                                                <Check className="h-3 w-3 mr-1" />
                                                Available
                                              </span>
                                            )}
                                        </div>
                                      </SelectItem>
                                    ))
                                ) : (
                                  <div className="px-4 py-6 text-center">
                                    <div className="flex flex-col items-center">
                                      <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
                                      <p className="text-sm text-red-500 font-semibold">
                                        No available slots
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Please select another date or groomer
                                      </p>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="px-4 py-6 text-center">
                                  <p className="text-sm text-gray-500">
                                    Please select a groomer first
                                  </p>
                                </div>
                              )}
                            </SelectContent>
                          </Select>

                          {/* Time slots legend */}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <div className="flex items-center border border-green-100 rounded px-2 py-1 bg-green-50/40">
                              <div className="w-3 h-3 rounded-full bg-green-100 mr-1.5 flex items-center justify-center">
                                <Check className="h-2 w-2 text-green-600" />
                              </div>
                              <span className="text-green-700">Available</span>
                            </div>
                            <div className="flex items-center border border-red-300 rounded px-2 py-1 bg-red-100/60">
                              <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5 flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="8"
                                  height="8"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M18 6 6 18"></path>
                                  <path d="m6 6 12 12"></path>
                                </svg>
                              </div>
                              <span className="text-red-700 font-medium">
                                Booked
                              </span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Add reservation warning when changing selections */}
                  {reservation && (
                    <div className="mt-2 text-sm text-amber-600">
                      <p>
                        Changing your date, time, or groomer will cancel your
                        current reservation.
                      </p>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white"
                      onClick={nextStep}
                      disabled={
                        !selectedDate || !form.getValues("appointmentTime")
                      }
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Pet Details */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">
                    Tell Us About Your Pet
                  </h3>

                  {/* Grooming Service Selection - only shown for grooming service type */}
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
                              {groomingPrices.map(
                                (option: {
                                  service: string;
                                  description: string;
                                }) => (
                                  <SelectItem
                                    key={option.service}
                                    value={option.service}
                                  >
                                    {option.service} - {option.description}
                                  </SelectItem>
                                )
                              )}
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
                            <Input
                              placeholder="e.g. Golden Retriever"
                              {...field}
                            />
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
                            <FormLabel>Add Transport Service</FormLabel>
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
                                    <RadioGroupItem
                                      value="one_way"
                                      id="one_way"
                                    />
                                    <Label htmlFor="one_way">
                                      One-way Transport (₱280)
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="round_trip"
                                      id="round_trip"
                                    />
                                    <Label htmlFor="round_trip">
                                      Round-trip Transport (₱380)
                                    </Label>
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
                    <Button type="button" variant="outline" onClick={prevStep}>
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
                  <h3 className="font-playfair text-xl font-semibold text-[#9a7d62] mb-6">
                    Contact Details
                  </h3>

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
                              <Input
                                placeholder="e.g. 09123456789"
                                {...field}
                              />
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
                      <label
                        htmlFor="terms"
                        className="ml-3 text-sm text-gray-700"
                      >
                        I agree to Novo Pets'{" "}
                        <a href="#" className="text-[#9a7d62] hover:underline">
                          Terms & Conditions
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-[#9a7d62] hover:underline">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
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

                  <h3 className="font-playfair text-2xl font-bold text-[#9a7d62] mb-4">
                    Booking Confirmed!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your appointment has been successfully scheduled. We've sent
                    a confirmation to your email and phone.
                  </p>

                  <div className="bg-white p-6 rounded-lg mb-8 inline-block">
                    <div className="text-left space-y-3">
                      <div className="flex">
                        <span className="font-semibold w-32 text-gray-700">
                          Booking ID:
                        </span>
                        <span className="text-gray-900">
                          #{bookingReference}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32 text-gray-700">
                          Service:
                        </span>
                        <span className="text-gray-900">
                          {form.getValues("serviceType").replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32 text-gray-700">
                          Date & Time:
                        </span>
                        <span className="text-gray-900">
                          {form.getValues("appointmentDate")
                            ? format(
                                new Date(form.getValues("appointmentDate")),
                                "MMMM d, yyyy"
                              )
                            : ""}{" "}
                          at {form.getValues("appointmentTime")}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32 text-gray-700">
                          Pet:
                        </span>
                        <span className="text-gray-900">
                          {form.getValues("petName")} (
                          {form.getValues("petBreed")})
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

          {/* Add reservation timer if we have an active reservation */}
          {reservation && reservationTimeLeft !== null && step < 5 && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-600">
                Time Slot Reserved
              </AlertTitle>
              <AlertDescription>
                Your selected time slot is reserved for{" "}
                {formatReservationTime(reservationTimeLeft)}. Please complete
                your booking before it expires.
              </AlertDescription>
            </Alert>
          )}

          {/* Show error message if there was a problem loading availability */}
          {availabilityError && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-600">
                Error Loading Availability
              </AlertTitle>
              <AlertDescription>
                There was a problem checking availability. We'll try again
                automatically, or you can{" "}
                <button
                  onClick={() => refetchAvailability()}
                  className="underline text-red-600 font-medium"
                >
                  try again now
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Show alert when no slots are available */}
          {selectedDate &&
            availabilityData?.availableTimeSlots &&
            Array.isArray(availabilityData.availableTimeSlots) &&
            availabilityData.availableTimeSlots.length > 0 &&
            !availabilityData.availableTimeSlots.some(
              (slot) => slot.available
            ) && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fully Booked</AlertTitle>
                <AlertDescription>
                  All time slots for{" "}
                  {format(new Date(selectedDate), "MMMM d, yyyy")} are fully
                  booked. Please select a different date.
                </AlertDescription>
              </Alert>
            )}
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

function StepIndicator({
  number,
  title,
  description,
  active,
  completed,
}: StepIndicatorProps) {
  return (
    <li className="flex">
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full",
          completed
            ? "bg-white text-[#9a7d62]"
            : active
            ? "bg-white/20 text-white"
            : "bg-white/10 text-white/70"
        )}
      >
        {completed ? <Check className="h-4 w-4" /> : number}
      </div>
      <div className="ml-4">
        <h4
          className={cn(
            "font-montserrat font-semibold",
            active || completed ? "text-white" : "text-white/70"
          )}
        >
          {title}
        </h4>
        <p
          className={cn(
            "text-sm",
            active || completed ? "text-white/90" : "text-white/60"
          )}
        >
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

function ServiceRadioItem({
  value,
  title,
  description,
  checked,
}: ServiceRadioItemProps) {
  return (
    <div
      className={cn(
        "border rounded-md p-4 cursor-pointer",
        checked
          ? "border-[#9a7d62] bg-[#9a7d62]/5"
          : "border-gray-200 hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
      )}
    >
      <div className="flex items-start">
        <RadioGroupItem value={value} id={value} className="mt-1" />
        <label htmlFor={value} className="ml-3 cursor-pointer flex-grow">
          <span className="block font-montserrat font-medium text-gray-900">
            {title}
          </span>
          <span className="block text-sm text-gray-500 mt-1">
            {description}
          </span>
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

function SizeRadioItem({
  value,
  title,
  description,
  checked,
}: SizeRadioItemProps) {
  return (
    <div
      className={cn(
        "border rounded-md p-3 cursor-pointer text-center",
        checked
          ? "border-[#9a7d62] bg-[#9a7d62]/5"
          : "border-gray-200 hover:border-[#9a7d62] hover:bg-[#9a7d62]/5"
      )}
    >
      <RadioGroupItem value={value} id={value} className="hidden" />
      <label htmlFor={value} className="cursor-pointer block">
        <span className="block font-montserrat font-medium text-gray-900">
          {title}
        </span>
        <span className="block text-xs text-gray-500 mt-1">{description}</span>
      </label>
    </div>
  );
}
