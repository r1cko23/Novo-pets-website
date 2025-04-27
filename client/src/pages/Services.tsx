import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ServiceTabs from "@/components/services/ServiceTabs";

export default function Services() {
  const [activeTab, setActiveTab] = useState("grooming");
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#9a7d62]/10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#9a7d62] mb-6">Our Premium Services</h1>
            <p className="text-lg text-gray-700">
              Explore our comprehensive range of luxury pet care services designed to pamper and care for your beloved companions. Please contact us directly for pricing details.
            </p>
          </div>
        </div>
      </section>
      
      {/* Services Introduction */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-4">Unparalleled Pet Care Experience</h2>
              <p className="text-gray-700 mb-4">
                At Novo Pets, we believe that every pet deserves the very best. Our services combine professional expertise with luxurious treatments to ensure your pet's comfort, health, and happiness.
              </p>
              <p className="text-gray-700 mb-6">
                From rejuvenating spa treatments to comfortable accommodations, our comprehensive service offerings are designed to meet all your pet care needs under one roof.
              </p>
              <Link href="/booking">
                <Button className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
                  Book a Service
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="/images/services/pet_spa.jpg" 
                alt="Luxury Pet Grooming" 
                className="rounded-lg shadow-md h-48 object-cover w-full"
              />
              <img 
                src="/images/services/pet_spa.jpg" 
                alt="Pet Spa Treatment" 
                className="rounded-lg shadow-md h-48 object-cover w-full"
              />
              <img 
                src="/images/services/pet_hotel.jpg" 
                alt="Pet Hotel Accommodations" 
                className="rounded-lg shadow-md h-48 object-cover w-full"
              />
              <img 
                src="/images/services/pet_daycare.jpg" 
                alt="Pet Daycare Activities" 
                className="rounded-lg shadow-md h-48 object-cover w-full"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Service Highlights */}
      <section className="py-12 bg-[#f8f5f2]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-8 text-center">Our Signature Services</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Luxury Grooming */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-48 mb-4 overflow-hidden rounded-md">
                <img 
                  src="/images/services/pet_spa.jpg" 
                  alt="Luxury Grooming" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-3">Luxury Grooming</h3>
              <p className="text-gray-700 mb-4">
                Our premium grooming services include aromatherapy, specialized shampoos, deep conditioning treatments, and more. Our expert groomers work with care and precision to ensure your pet looks and feels their best.
              </p>
              <ul className="mb-4 text-sm text-gray-700">
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Full coat care with premium products</span>
                </li>
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Relaxing aromatherapy treatments</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Breed-specific styling and trims</span>
                </li>
              </ul>
              <Link 
                href="#services" 
                onClick={() => {
                  setActiveTab("grooming");
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Button 
                  variant="outline" 
                  className="w-full border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/10"
                >
                  View Services
                </Button>
              </Link>
            </div>
            
            {/* Pet Hotel */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-48 mb-4 overflow-hidden rounded-md">
                <img 
                  src="/images/services/pet_hotel.jpg" 
                  alt="Pet Hotel" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-3">Boutique Pet Hotel</h3>
              <p className="text-gray-700 mb-4">
                Our pet hotel offers comfortable accommodations with personalized care. We provide a home-away-from-home experience where your pet will receive attention, exercise, and proper care during their stay.
              </p>
              <ul className="mb-4 text-sm text-gray-700">
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Comfortable, spacious accommodations</span>
                </li>
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Regular exercise and playtime</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>24/7 monitoring and care</span>
                </li>
              </ul>
              <Link 
                href="#services" 
                onClick={() => {
                  setActiveTab("hotel");
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Button 
                  variant="outline" 
                  className="w-full border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/10"
                >
                  View Services
                </Button>
              </Link>
            </div>
            
            {/* Daycare */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-48 mb-4 overflow-hidden rounded-md">
                <img 
                  src="/images/services/pet_daycare.jpg" 
                  alt="Pet Daycare" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-3">Exclusive Daycare</h3>
              <p className="text-gray-700 mb-4">
                Our daycare services provide a safe, supervised environment where your pet can socialize, play, and exercise while you're away. We ensure your pet stays happy, engaged, and well-cared for throughout the day.
              </p>
              <ul className="mb-4 text-sm text-gray-700">
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Supervised play and socialization</span>
                </li>
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Stimulating activities and exercise</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Rest periods in comfortable areas</span>
                </li>
              </ul>
              <Link 
                href="#services" 
                onClick={() => {
                  setActiveTab("daycare");
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Button 
                  variant="outline" 
                  className="w-full border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/10"
                >
                  View Services
                </Button>
              </Link>
            </div>
            
            {/* Transport Service */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-48 mb-4 overflow-hidden rounded-md">
                <img 
                  src="/images/services/paw-pickup.jpg" 
                  alt="Transport Service" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-3">Pick-up & Drop-off</h3>
              <p className="text-gray-700 mb-4">
                Our convenient transport service makes pet care hassle-free. We'll pick up your pet from your home and return them after their appointment, saving you time and ensuring your pet arrives safely.
              </p>
              <ul className="mb-4 text-sm text-gray-700">
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Safe and comfortable transportation</span>
                </li>
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Service within 3km radius</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>One-way or round-trip options</span>
                </li>
              </ul>
              <Link 
                href="#services" 
                onClick={() => {
                  setActiveTab("transport");
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Button 
                  variant="outline" 
                  className="w-full border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/10"
                >
                  View Services
                </Button>
              </Link>
            </div>
            
            {/* Spa Treatments */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-48 mb-4 overflow-hidden rounded-md">
                <img 
                  src="/images/services/pet_spa.jpg" 
                  alt="Spa Treatments" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-3">Exclusive Spa Add-Ons</h3>
              <p className="text-gray-700 mb-4">
                Enhance your pet's grooming experience with our exclusive spa add-ons. From aromatherapy to deep conditioning treatments, these luxurious services will leave your pet feeling refreshed and rejuvenated.
              </p>
              <ul className="mb-4 text-sm text-gray-700">
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Aromatherapy bliss treatment</span>
                </li>
                <li className="flex items-center mb-1">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Deep coat hydration mask</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#9a7d62] mr-2">✓</span>
                  <span>Paw balm & nail spa treatment</span>
                </li>
              </ul>
              <Link 
                href="#services" 
                onClick={() => {
                  setActiveTab("grooming");
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Button 
                  variant="outline" 
                  className="w-full border-[#9a7d62] text-[#9a7d62] hover:bg-[#9a7d62]/10"
                >
                  View Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Service Pricing Tables */}
      <ServiceTabs />
      
      {/* CTA Section */}
      <section className="py-16 bg-[#9a7d62]/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62] mb-6">Ready to Pamper Your Pet?</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Book an appointment today and treat your furry friend to the premium pet care experience they deserve.
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
              Book an Appointment
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
