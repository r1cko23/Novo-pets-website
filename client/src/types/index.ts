export interface TimeSlot {
  time: string;
  groomer: string;
  available: boolean;
  formattedTime?: string;
}

export interface Reservation {
  id: string;
  expiresAt: Date;
  date: string;
  time: string;
  groomer: string;
}
