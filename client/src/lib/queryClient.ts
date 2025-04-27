import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(errorBody.message || `API request failed with status ${res.status}`);
    (error as any).status = res.status;
    (error as any).errorCode = errorBody.errorCode;
    (error as any).originalResponse = res;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Enhance error with more context for better recovery
    if (error instanceof Error) {
      if (url.includes('/api/availability')) {
        error.name = 'AvailabilityError';
      } else if (url.includes('/api/bookings')) {
        error.name = 'BookingError';
      } else if (url.includes('/api/reservations')) {
        error.name = 'ReservationError';
      }
      
      // Add retry information to help with recovery
      (error as any).isRetryable = !url.includes('bookings') || method !== 'POST'; 
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export function invalidateAvailabilityQueries(date?: string) {
  if (date) {
    queryClient.invalidateQueries({ queryKey: ["availability", date] });
    console.log(`Invalidated availability for date: ${date}`);
  } else {
    queryClient.invalidateQueries({ queryKey: ["availability"] });
    console.log("Invalidated all availability queries");
  }
}

// Helper function to create a reservation for a time slot
export async function createReservation(
  date: string,
  time: string,
  groomer: string
): Promise<{ reservationId: string; expiresIn: number } | null> {
  try {
    const response = await apiRequest("POST", "/api/reservations", {
      appointmentDate: date,
      appointmentTime: time,
      groomer: groomer
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to create reservation:", error);
      return null;
    }
    
    const data = await response.json();
    return {
      reservationId: data.reservationId,
      expiresIn: data.expiresIn || 300 // Default to 5 minutes if not specified
    };
  } catch (error) {
    console.error("Error creating reservation:", error);
    return null;
  }
}
