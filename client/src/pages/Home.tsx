import Hero from "@/components/home/Hero";
import ServicesOverview from "@/components/home/ServicesOverview";
import Testimonials from "@/components/home/Testimonials";
import MapContainer from "@/components/contact/MapContainer";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero takes up full viewport height */}
      <Hero />
      
      {/* Content below hero section */}
      <div className="content-below-hero flex-grow">
        <ServicesOverview />
        
        {/* About Section Teaser */}
        <section className="py-16 bg-[#436e4f]/5">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1603123853880-a92fafb7809f?q=80&w=1000&auto=format&fit=crop" 
                    alt="About Novo Pets" 
                    className="rounded-lg shadow-xl w-full"
                  />
                  <div className="absolute -bottom-6 -right-6 bg-[#9a7d62]/90 text-white p-6 rounded-lg shadow-lg max-w-xs hidden md:block">
                    <p className="italic font-serif">"Every pet deserves the royal treatment."</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#9a7d62]">About Novo Pets</h2>
                <p className="mt-6 text-gray-700">
                  Located in White Plains, Katipunan Avenue, Novo Pets offers a high-end Pet Spa & Wellness Center specializing in luxury pet grooming, spa treatments, holistic pet care, premium daycare, and a boutique pet hotel experience.
                </p>
                
                <div className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-serif font-semibold text-[#436e4f]">Our Mission</h3>
                    <p className="mt-2 text-gray-700">
                      "To provide top-tier pet care services, ensuring the happiness and well-being of pets and their owners."
                    </p>
                  </div>
                  
                  <div>
                    <Link href="/about">
                      <Button className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
                        Learn More About Us <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <Testimonials />
        
        {/* Location Map Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#9a7d62] mb-6 text-center">Find Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 text-center">
              Visit our luxury pet care center at White Plains, Katipunan Avenue.
            </p>
            <div className="max-w-4xl mx-auto">
              <MapContainer height="400px" className="rounded-lg shadow-xl w-full" />
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#9a7d62] mb-6">Ready to Pamper Your Pet?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Book an appointment now and treat your furry friend to the premium pet care experience they deserve.
            </p>
            <Link href="/booking">
              <Button size="lg" className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
                Book an Appointment
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
