import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { serviceImages } from "@shared/schema";

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const parallaxRef = useRef<HTMLDivElement>(null);
  const backgroundImagePath = serviceImages.heroBackground;
  
  // Handle mouse move for parallax effect
  useEffect(() => {
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
  }, []);
  
  // Calculate parallax effect
  const calcParallax = (mouseX: number, mouseY: number, depth: number = 0.02) => {
    if (!parallaxRef.current) return { x: 0, y: 0 };
    
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
    <section className="relative overflow-hidden">
      <div 
        ref={parallaxRef}
        className="relative bg-cover bg-center min-h-screen" 
        style={{
          height: '100vh',
        }}
      >
        {/* Animated Background */}
        <motion.div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: `url('${backgroundImagePath}')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            x: parallaxEffect.x,
            y: parallaxEffect.y,
          }}
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 20,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        
        {/* Gradient Overlay with animation */}
        <motion.div 
          className="absolute inset-0 z-10"
          initial={{ opacity: 0.7 }}
          animate={{ 
            opacity: [0.7, 0.5, 0.7],
            background: [
              'linear-gradient(to right, rgba(38, 34, 32, 0.7), rgba(38, 34, 32, 0.4))',
              'linear-gradient(to right, rgba(38, 34, 32, 0.6), rgba(38, 34, 32, 0.3))',
              'linear-gradient(to right, rgba(38, 34, 32, 0.7), rgba(38, 34, 32, 0.4))'
            ]
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        
        {/* Floating 3D elements */}
        <div className="absolute inset-0 z-20 overflow-hidden">
          <motion.div 
            className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-pink-300/20 to-purple-300/20 blur-3xl"
            style={{ top: '30%', left: '15%' }}
            animate={{
              y: [0, -50, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 15,
              ease: "easeInOut",
              repeat: Infinity
            }}
          />
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-amber-300/10 to-yellow-300/10 blur-3xl"
            style={{ top: '50%', right: '20%' }}
            animate={{
              y: [0, 40, 0],
              x: [0, -20, 0],
              scale: [1, 1.2, 1],
              rotate: [0, -8, 0]
            }}
            transition={{
              duration: 18,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 2
            }}
          />
        </div>
        
        <div className="absolute inset-0 flex items-center z-30">
          <div className="container mx-auto px-6 md:px-12">
            <motion.div
              initial="hidden"
              animate="visible"
              className="w-full lg:w-2/3"
            >
              <motion.div 
                className="relative inline-block"
                custom={0}
                variants={heroTextAnimation}
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 drop-shadow-lg">
                  Novo Pets Premium
                </h1>
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-amber-400 opacity-30 blur-xl -z-10"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity
                  }}
                />
              </motion.div>
              
              <motion.h2 
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-100"
                custom={1}
                variants={heroTextAnimation}
              >
                Pet Spa & Wellness
              </motion.h2>
              
              <motion.p 
                className="mt-8 text-white text-xl md:text-2xl font-light opacity-90 max-w-xl"
                custom={2}
                variants={heroTextAnimation}
              >
                Where Pets Feel at Home
              </motion.p>
              
              <motion.div 
                className="mt-10 flex flex-col sm:flex-row gap-6"
                custom={3}
                variants={heroTextAnimation}
              >
                <Link href="/booking">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-[#9a7d62] to-[#8C636A] hover:from-[#9a7d62]/90 hover:to-[#8C636A]/90 text-white px-8 py-6 h-auto font-semibold text-lg rounded-full shadow-[0_0_20px_rgba(154,125,98,0.5)] backdrop-blur-sm"
                    >
                      Book an Appointment
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/services">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-6 h-auto font-semibold text-lg rounded-full"
                    >
                      Explore Services
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: [0.4, 0.8, 0.4],
            y: [0, 10, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            delay: 1
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-white/80 text-sm mb-2">Scroll</span>
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-1">
              <motion.div 
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{ 
                  y: [0, 15, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
