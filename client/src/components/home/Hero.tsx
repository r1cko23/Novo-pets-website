import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="relative bg-cover bg-center h-[600px]"
        style={{
          backgroundImage: `url('/images/novopets_newbg.jpg')`,
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#262220]/50 to-[#262220]/30"></div>

        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            <div className="w-full lg:w-2/3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
                Novo Pets Premium Pet Spa & Wellness
              </h1>
              <p className="mt-6 text-white text-lg md:text-xl opacity-90 max-w-xl">
                Where Pets Feel at Home
              </p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/booking">
                  <Button
                    size="lg"
                    className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white px-8 py-4 h-auto font-serif font-semibold"
                  >
                    Book an Appointment
                  </Button>
                </Link>
                <Link href="/services">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-8 py-4 h-auto font-serif font-semibold"
                  >
                    Explore Services
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
