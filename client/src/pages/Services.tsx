import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ServiceTabs from "@/components/services/ServiceTabs";
import { serviceImages } from "@shared/schema";

export default function Services() {
  const [activeTab, setActiveTab] = useState("grooming");
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#9a7d62]/10 py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#9a7d62]">Our Premium Services</h1>
            <p className="text-lg text-gray-700">
              Explore our comprehensive range of luxury pet care services designed to pamper and care for your beloved companions. Please contact us directly for pricing details.
            </p>
          </div>
        </div>
      </section>
      
      {/* Services Introduction */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-playfair font-bold text-[#9a7d62]">Unparalleled Pet Care Experience</h2>
              <div className="flex flex-col gap-2">
                <p className="text-gray-700">
                  At Novo Pets, we believe that every pet deserves the very best. Our services combine professional expertise with luxurious treatments to ensure your pet's comfort, health, and happiness.
                </p>
                <p className="text-gray-700">
                  From rejuvenating spa treatments to comfortable accommodations, our comprehensive service offerings are designed to meet all your pet care needs under one roof.
                </p>
              </div>
              <Link href="/booking">
                <Button className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
                  Book a Service
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <img 
                src={serviceImages.petSpa} 
                alt="Luxury Pet Grooming" 
                className="rounded-lg shadow-md h-56 object-cover object-center w-full"
              />
              <img 
                src={serviceImages.spaSession} 
                alt="Pet Spa Treatment" 
                className="rounded-lg shadow-md h-56 object-cover object-center w-full"
              />
              <img 
                src={serviceImages.petHotel} 
                alt="Pet Hotel Accommodations" 
                className="rounded-lg shadow-md h-56 object-cover object-center w-full"
              />
              <img 
                src={serviceImages.petDaycare} 
                alt="Pet Daycare Activities" 
                className="rounded-lg shadow-md h-56 object-cover object-center w-full"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Service Highlights */}
      <section className="py-8 bg-[#f8f5f2]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-5 mb-5">
            <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] text-center">Our Signature Services</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Luxury Grooming */}
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-3">
              <div className="h-56 mb-3 overflow-hidden rounded-md bg-gray-50">
                <img 
                  src={serviceImages.petSpa} 
                  alt="Luxury Grooming" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62]">Luxury Grooming</h3>
              <p className="text-gray-700 text-sm">
                Our premium grooming services include aromatherapy, specialized shampoos, deep conditioning treatments, and more. Our expert groomers work with care and precision to ensure your pet looks and feels their best.
              </p>
              <ul className="text-sm text-gray-700 flex flex-col gap-1">
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
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-3">
              <div className="h-56 mb-3 overflow-hidden rounded-md bg-gray-50">
                <img 
                  src={serviceImages.petHotel} 
                  alt="Pet Hotel" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62]">Boutique Pet Hotel</h3>
              <p className="text-gray-700 text-sm">
                Our pet hotel offers comfortable accommodations with personalized care. We provide a home-away-from-home experience where your pet will receive attention, exercise, and proper care during their stay.
              </p>
              <ul className="text-sm text-gray-700 flex flex-col gap-1">
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
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-3">
              <div className="h-56 mb-3 overflow-hidden rounded-md bg-gray-50">
                <img 
                  src={serviceImages.petDaycare} 
                  alt="Pet Daycare" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62]">Exclusive Daycare</h3>
              <p className="text-gray-700 text-sm">
                Our daycare services provide a safe, supervised environment where your pet can socialize, play, and exercise while you're away. We ensure your pet stays happy, engaged, and well-cared for throughout the day.
              </p>
              <ul className="text-sm text-gray-700 flex flex-col gap-1">
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
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-3">
              <div className="h-56 mb-3 overflow-hidden rounded-md bg-gray-50">
                <img 
                  src={serviceImages.pawPickup} 
                  alt="Transport Service" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62]">Pick-up & Drop-off</h3>
              <p className="text-gray-700 text-sm">
                Our convenient transport service makes pet care hassle-free. We'll pick up your pet from your home and return them after their appointment, saving you time and ensuring your pet arrives safely.
              </p>
              <ul className="text-sm text-gray-700 flex flex-col gap-1">
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
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-3">
              <div className="h-56 mb-3 overflow-hidden rounded-md bg-gray-50">
                <img 
                  src={serviceImages.spaSession} 
                  alt="Spa Treatments" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62]">Exclusive Spa Add-Ons</h3>
              <p className="text-gray-700 text-sm">
                Enhance your pet's grooming experience with our exclusive spa add-ons. From aromatherapy to deep conditioning treatments, these luxurious services will leave your pet feeling refreshed and rejuvenated.
              </p>
              <ul className="text-sm text-gray-700 flex flex-col gap-1">
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
      <section className="py-8 bg-[#9a7d62]/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-5 text-center">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62]">Ready to Pamper Your Pet?</h2>
            <p className="text-lg text-gray-700 max-w-2xl">
              Book an appointment today and treat your furry friend to the premium pet care experience they deserve.
            </p>
            <Link href="/booking">
              <Button size="lg" className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
                Book an Appointment
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
