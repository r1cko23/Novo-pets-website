import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingForm from "@/components/booking/BookingForm";

export default function Booking() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#9a7d62]/10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#9a7d62] mb-6">Book Your Pet's Experience</h1>
            <p className="text-lg text-gray-700">
              Schedule an appointment for any of our premium services. It's quick, easy, and your pet will thank you!
            </p>
          </div>
        </div>
      </section>
      
      {/* Booking Form Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62]">Book Your Pet's Experience</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Schedule an appointment for any of our premium services
            </p>
          </div>
          
          <BookingForm />
        </div>
      </section>
      
      {/* Why Book With Us */}
      <section className="py-16 bg-[#f8f5f2]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-12 text-center">
            Why Book With Novo Pets
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#9a7d62]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#9a7d62]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              </div>
              <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-3">Expert Care</h3>
              <p className="text-gray-700">
                Our professional staff is trained to provide the highest quality care for your beloved pet.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#9a7d62]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#9a7d62]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-3">Convenient Booking</h3>
              <p className="text-gray-700">
                Our online booking system makes it quick and easy to schedule appointments anytime.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#9a7d62]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#9a7d62]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-3">Transport Service</h3>
              <p className="text-gray-700">
                Optional pick-up and drop-off service within 3km radius for hassle-free pet care.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#9a7d62]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#9a7d62]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </div>
              <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-3">Pet-Centered Approach</h3>
              <p className="text-gray-700">
                We tailor our services to your pet's individual needs, ensuring a stress-free experience.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-12 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">How far in advance should I book?</h3>
              <p className="text-gray-700">
                We recommend booking at least 3-5 days in advance, especially for weekends and holidays. For express services, please call us directly to check availability.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">What if I need to cancel or reschedule?</h3>
              <p className="text-gray-700">
                We understand plans change. Please give us at least 24 hours' notice for cancellations or rescheduling to avoid any fees.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">Does my pet need to be vaccinated?</h3>
              <p className="text-gray-700">
                Yes, for the safety of all our furry clients, we require proof of up-to-date vaccinations for boarding and daycare services.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">How long will my pet's grooming session take?</h3>
              <p className="text-gray-700">
                Standard grooming sessions typically take 2-3 hours depending on your pet's size, coat condition, and the services requested. Express services are completed within 1 hour.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">What should I bring for my pet's hotel stay?</h3>
              <p className="text-gray-700">
                We recommend bringing your pet's food, any medications, a favorite toy or blanket for comfort, and detailed care instructions.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">Do you offer any discounts for multiple pets?</h3>
              <p className="text-gray-700">
                Yes! We offer a 10% discount for additional pets from the same household when services are booked for the same day.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-700 mb-4">
              Have more questions? We're happy to help!
            </p>
            <Link href="/contact">
              <Button variant="outline" className="border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-[#9a7d62]/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62] mb-6">Experience Premium Pet Care Today</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Book an appointment now or contact us if you have any questions about our services.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/booking">
              <Button size="lg" className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
                Book an Appointment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/10">
                Explore Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
