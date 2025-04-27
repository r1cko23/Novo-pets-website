// api/schema.js
// This is a simplified version of the schema for the availability API

// Pet size enum
export const PetSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  GIANT: 'giant'
};

// Basic type to pass time slots data
export const TimeSlot = {
  time: '',
  groomer: ''
};

// Basic booking types
export const Booking = {
  id: 0,
  serviceType: '',
  appointmentDate: '',
  appointmentTime: '',
  petName: '',
  petBreed: '',
  petSize: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  groomer: null,
  status: ''
};

export const InsertBooking = {
  serviceType: '',
  appointmentDate: '',
  appointmentTime: '',
  petName: '',
  petBreed: '',
  petSize: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  groomer: null
};

export const ContactFormValues = {
  name: '',
  email: '',
  subject: '',
  message: ''
}; 