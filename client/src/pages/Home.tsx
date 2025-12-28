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
      {/* Hero takes up full viewport height, adjusted for fixed navbar */}
      <div className="relative z-0">
        <Hero />
      </div>
      
      {/* Content below hero section */}
      <div className="content-below-hero flex-grow relative z-10">
        <ServicesOverview />
        
        {/* About Section Teaser */}
        <section className="py-12 bg-[#436e4f]/5">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:w-1/2">
                <div className="relative">
                  <img 
                    src="/images/about/Photoshoot 13.jpg" 
                    alt="About Novo Pets" 
                    className="rounded-lg shadow-xl w-full"
                  />
                  <div className="absolute -bottom-6 -right-6 bg-[#9a7d62]/90 text-white p-6 rounded-lg shadow-lg max-w-xs hidden md:block">
                    <p className="italic font-serif">"Every pet deserves the royal treatment."</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2 flex flex-col gap-4">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#9a7d62]">About Novo Pets</h2>
                <p className="text-gray-700">
                  Located in White Plains, Katipunan Avenue, Novo Pets offers a high-end Pet Spa & Wellness Center specializing in luxury pet grooming, spa treatments, holistic pet care, premium daycare, and a boutique pet hotel experience.
                </p>
                
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-serif font-semibold text-[#436e4f]">Our Mission</h3>
                    <p className="text-gray-700">
                      "To provide top-tier pet care services, ensuring the happiness and well-being of pets and their owners."
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <Link href="/about">
                      <Button className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white flex items-center gap-2">
                        Learn More About Us <ArrowRight className="h-4 w-4" />
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
        <section className="py-12 bg-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center gap-5">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#9a7d62] text-center">Find Us</h2>
              <p className="text-lg text-gray-600 max-w-2xl text-center">
                Visit our luxury pet care center at White Plains, Katipunan Avenue.
              </p>
              <div className="max-w-4xl w-full">
                <MapContainer height="400px" className="rounded-lg shadow-xl w-full" />
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section with 2025 Design Enhancements */}
        <section className="py-12 bg-gradient-mesh relative overflow-hidden">
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-[#9a7d62]/20 to-[#8C636A]/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-[#436e4f]/20 to-[#9a7d62]/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center gap-5 text-center">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#9a7d62] text-reveal">
                Ready to Pamper Your Pet?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl text-reveal" style={{ animationDelay: '0.1s' }}>
                Book an appointment now and treat your furry friend to the premium pet care experience they deserve.
              </p>
              <Link href="/booking">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[#9a7d62] to-[#8C636A] hover:from-[#9a7d62]/90 hover:to-[#8C636A]/90 text-white magnetic pulse-glow shadow-xl flex items-center gap-2"
                >
                  Book an Appointment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
