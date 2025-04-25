import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star, StarHalf } from "lucide-react";
import { testimonials } from "@shared/schema";

export default function Testimonials() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(2);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSliderMetrics = () => {
      if (window.innerWidth < 768) {
        setTotalSlides(testimonials.length);
      } else if (window.innerWidth < 1024) {
        setTotalSlides(testimonials.length - 1);
      } else {
        setTotalSlides(testimonials.length - 2);
      }
    };

    updateSliderMetrics();
    window.addEventListener('resize', updateSliderMetrics);
    return () => window.removeEventListener('resize', updateSliderMetrics);
  }, []);

  const updateSlider = () => {
    if (!sliderRef.current) return;

    let translateValue = 0;
    
    // Calculate the appropriate translation based on screen size
    if (window.innerWidth < 768) {
      translateValue = currentSlide * 100;
    } else if (window.innerWidth < 1024) {
      translateValue = currentSlide * 50;
    } else {
      translateValue = currentSlide * 33.33;
    }
    
    sliderRef.current.style.transform = `translateX(-${translateValue}%)`;
  };

  useEffect(() => {
    updateSlider();
  }, [currentSlide]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="py-16 bg-[#9a7d62]/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62]">What Fur Parents Say</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Hear from our happy customers and their furry friends</p>
        </div>
        
        <div className="relative">
          {/* Testimonial Slider */}
          <div className="testimonial-slider overflow-hidden">
            <div 
              ref={sliderRef}
              className="flex transition-transform duration-500"
            >
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          </div>
          
          {/* Slider Controls */}
          <button 
            className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#9a7d62] p-2 rounded-full shadow-md z-10"
            onClick={prevSlide}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#9a7d62] p-2 rounded-full shadow-md z-10"
            onClick={nextSlide}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        {/* Slider Indicators */}
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index === currentSlide ? "bg-[#9a7d62]" : "bg-gray-300 hover:bg-[#9a7d62]/50"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: {
    name: string;
    image: string;
    text: string;
    serviceUsed: string;
    rating: number;
  };
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4">
      <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
            <img 
              src={testimonial.image} 
              alt={testimonial.name} 
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h4 className="font-montserrat font-semibold">{testimonial.name}</h4>
            <div className="text-yellow-400 flex">
              {Array.from({ length: Math.floor(testimonial.rating) }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
              {testimonial.rating % 1 !== 0 && (
                <StarHalf className="h-4 w-4 fill-current" />
              )}
            </div>
          </div>
        </div>
        <p className="text-gray-600 italic flex-grow">{testimonial.text}</p>
        <p className="text-sm text-gray-500 mt-4">{testimonial.serviceUsed}</p>
      </div>
    </div>
  );
}
