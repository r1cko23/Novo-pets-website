import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function generateTimeSlots(): string[] {
  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    if (hour !== 12) { // Skip 12 PM (lunch)
      const startTime = hour < 12 
        ? `${hour}:00 AM` 
        : `${hour === 12 ? 12 : hour - 12}:00 PM`;
      const endTime = hour + 1 < 12 
        ? `${hour + 1}:00 AM` 
        : `${hour + 1 === 12 ? 12 : hour + 1 - 12}:00 PM`;
      
      timeSlots.push(`${startTime} - ${endTime}`);
    }
  }
  return timeSlots;
}

export function getBookingReference(): string {
  const prefix = "NP";
  const randomNumbers = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${randomNumbers}`;
}
