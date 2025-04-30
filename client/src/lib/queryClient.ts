import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    try {
      const errorBody = await res.json();
      const error = new Error(errorBody.message || `API request failed with status ${res.status}`);
      (error as any).status = res.status;
      (error as any).errorCode = errorBody.errorCode;
      (error as any).originalResponse = res;
      (error as any).errorBody = errorBody;
      throw error;
    } catch (jsonError) {
      // If we can't parse the JSON, just throw a generic error
      const error = new Error(`API request failed with status ${res.status}`);
      (error as any).status = res.status;
      (error as any).originalResponse = res;
      throw error;
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      ...options
    });

    // Don't throw here, just return the response
    // This allows the caller to handle different status codes
    return res;
  } catch (error) {
    // This will catch network errors like CORS, offline, etc.
    console.error(`Network error making ${method} request to ${url}:`, error);
    
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
      // Add a more user-friendly message
      (error as any).userMessage = "Network error: Please check your internet connection and try again.";
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

export function invalidateAvailabilityQueries(date?: string, forceRefresh = false) {
  if (date) {
    // Invalidate for specific date
    queryClient.invalidateQueries({ queryKey: ["availability", date] });
    console.log(`Invalidated availability for date: ${date}`);
    
    // If force refresh requested, clear entire cache and refetch
    if (forceRefresh) {
      queryClient.refetchQueries({ queryKey: ["availability", date], exact: true });
      console.log(`Force refreshing availability for date: ${date}`);
    }
  } else {
    // Invalidate all availability queries
    queryClient.invalidateQueries({ queryKey: ["availability"] });
    console.log("Invalidated all availability queries");
    
    // If force refresh requested, clear entire availability cache
    if (forceRefresh) {
      queryClient.refetchQueries({ queryKey: ["availability"] });
      console.log("Force refreshing all availability queries");
    }
  }
}

// Helper function to create a reservation for a time slot
export async function createReservation(date: string, time: string, groomer: string) {
  const response = await apiRequest('POST', '/api/reservations', {
    appointmentDate: date,
    appointmentTime: time,
    groomer
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create reservation');
  }
  
  // Force refresh availability data after creating a reservation
  await invalidateAvailabilityQueries(date, true);
  
  return response.json();
}
