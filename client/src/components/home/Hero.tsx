import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { serviceImages } from "@shared/schema";

// Custom hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if device is mobile based on screen width
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    checkIsMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIsMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
}

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const parallaxRef = useRef<HTMLDivElement>(null);
  const backgroundImagePath = serviceImages.heroBackground;
  const isMobile = useIsMobile();
  
  // Handle mouse move for parallax effect - only on desktop
  useEffect(() => {
    if (isMobile) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobile]);
  
  // Calculate parallax effect
  const calcParallax = (mouseX: number, mouseY: number, depth: number = 0.02) => {
    if (!parallaxRef.current || isMobile) return { x: 0, y: 0 };
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const offsetX = (mouseX - centerX) * depth;
    const offsetY = (mouseY - centerY) * depth;
    
    return { x: offsetX, y: offsetY };
  };
  
  const parallaxEffect = calcParallax(mousePosition.x, mousePosition.y);
  
  // Animation variants
  const heroTextAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay: custom * 0.1,
      }
    })
  };
  
  return (
    <Section 
      spacing="none" 
      background="default"
      className="relative overflow-hidden min-h-screen flex items-center"
    >
      <div 
        ref={parallaxRef}
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{
          height: '100vh',
        }}
      >
        {/* Animated Background */}
        {isMobile ? (
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{
              backgroundImage: `url('${backgroundImagePath}')`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-300 ease-out"
            style={{
              backgroundImage: `url('${backgroundImagePath}')`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              transform: `translate(${parallaxEffect.x}px, ${parallaxEffect.y}px)`,
            }}
          />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 z-10" />
      </div>
      
      {/* Content */}
      <Container className="relative z-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Main Heading */}
          <motion.h1 
            custom={0}
            variants={heroTextAnimation}
            className="text-responsive-xl font-serif font-bold text-white leading-tight"
          >
            Professional Pet Grooming
            <br />
            <span className="gradient-text">That Your Pets Deserve</span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            custom={1}
            variants={heroTextAnimation}
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
          >
            Experience luxury pet care with our expert groomers. 
            From basic grooming to spa treatments, we treat every pet like family.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            custom={2}
            variants={heroTextAnimation}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/booking">
              <Button variant="brand" size="xl" className="rounded-full">
                Book Appointment
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="glass" size="xl" className="rounded-full">
                View Services
              </Button>
            </Link>
          </motion.div>
          
          {/* Trust Indicators */}
          <motion.div 
            custom={3}
            variants={heroTextAnimation}
            className="flex flex-wrap justify-center items-center gap-8 pt-8 text-white/80"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Expert Groomers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Safe & Clean</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Luxury Experience</span>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  );
}
