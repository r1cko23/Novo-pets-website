import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { serviceImages } from "@shared/schema";

// Custom hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const parallaxRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const x = (clientX - innerWidth / 2) / innerWidth;
      const y = (clientY - innerHeight / 2) / innerHeight;
      
      setMousePosition({ x, y });
    };

    const handleScroll = () => {
      if (isMobile || !parallaxRef.current) return;
      
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      parallaxRef.current.style.transform = `translateY(${rate}px)`;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]);

  // Animation variants
  const heroTextAnimation = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: "easeOut"
      }
    })
  };

  // Calculate parallax transform
  const calcParallax = (speed: number) => {
    if (isMobile) return {};
    return {
      transform: `translate(${mousePosition.x * speed}px, ${mousePosition.y * speed}px)`
    };
  };

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Background with parallax */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/novopets_newbg.jpg')`,
          transform: `translateY(0px)`,
        }}
      />

      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0"
        style={calcParallax(20)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-tl from-brand-secondary/20 to-brand-primary/20 rounded-full blur-xl" />
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#262220]/60 via-[#262220]/40 to-[#262220]/20" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 md:px-12">
        <motion.div
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Main Heading */}
          <motion.h1
            custom={0}
            variants={heroTextAnimation}
            className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-white leading-tight max-w-4xl"
            style={calcParallax(5)}
          >
            Novo Pets Premium Pet Spa & Wellness
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            custom={1}
            variants={heroTextAnimation}
            className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed"
            style={calcParallax(3)}
          >
            Where Pets Feel at Home
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            custom={2}
            variants={heroTextAnimation}
            className="flex flex-col sm:flex-row gap-4"
            style={calcParallax(2)}
          >
            <Link href="/booking">
              <Button
                size="lg"
                className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white px-8 py-4 h-auto font-serif font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              >
                Book an Appointment
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-8 py-4 h-auto font-serif font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              >
                Explore Services
              </Button>
            </Link>
          </motion.div>

          {/* Floating service preview */}
          <motion.div
            custom={3}
            variants={heroTextAnimation}
            className="hidden lg:block absolute right-8 top-1/2 transform -translate-y-1/2"
            style={calcParallax(-10)}
          >
            <div className="grid grid-cols-2 gap-4">
              {Object.values(serviceImages)
                .filter((image): image is string => typeof image === 'string' && image !== null)
                .slice(0, 4)
                .map((image: string, index: number) => (
                  <motion.div
                    key={index}
                    className="w-24 h-24 rounded-lg overflow-hidden shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={image}
                      alt={`Service ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-3 bg-white/60 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
