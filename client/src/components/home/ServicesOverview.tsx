import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { serviceOverviewItems } from "@shared/schema";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";

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

export default function ServicesOverview() {
  const [titleRef, titleInView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });
  const isMobile = useIsMobile();
  
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnptLTI0IDZoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnptMTIgMGg2djZoLTZ2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat opacity-50"></div>
      </div>
      
      <div className="container mx-auto px-6">
        {isMobile ? (
          <div 
            ref={titleRef}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-sm uppercase tracking-widest text-[#9a7d62]/80 font-medium">Premium Care</span>
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9a7d62] to-[#8C636A]">
              Our Premium Services
            </h2>
            
            <div className="mt-6 max-w-2xl mx-auto relative">
              <p className="text-lg text-gray-700">
                Experience the finest pet care services designed for your pet's comfort and wellness
              </p>
            </div>
          </div>
        ) : (
          <motion.div 
            ref={titleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-sm uppercase tracking-widest text-[#9a7d62]/80 font-medium">Premium Care</span>
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9a7d62] to-[#8C636A]">
              Our Premium Services
            </h2>
            
            <div className="mt-6 max-w-2xl mx-auto relative">
              <p className="text-lg text-gray-700">
                Experience the finest pet care services designed for your pet's comfort and wellness
              </p>
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-[#9a7d62]/20 to-[#8C636A]/20 opacity-30 blur-xl -z-10 rounded-full"
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 4,
                  ease: "easeInOut",
                  repeat: Infinity
                }}
              />
            </div>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {serviceOverviewItems.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              image={service.image}
              index={index}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  index: number;
  isMobile: boolean;
}

function ServiceCard({ title, description, image, index, isMobile }: ServiceCardProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  if (isMobile) {
    return (
      <div>
        <div className="h-full backdrop-blur-sm bg-white/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] border border-white/20 relative group">
          <div className="h-56 overflow-hidden relative">
            <img 
              src={image}
              alt={title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          <div className="p-8 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#9a7d62]/10 to-transparent rounded-full blur-xl opacity-70 -mt-10 -mr-10"></div>
            
            <h3 className="font-bold text-xl text-[#9a7d62] mb-3 tracking-tight relative z-10">
              {title}
            </h3>
            
            <p className="text-gray-600 mb-6 relative z-10 line-clamp-3">
              {description}
            </p>
            
            <Link href="/services">
              <div className="inline-flex items-center font-medium relative z-10">
                <span className="bg-gradient-to-r from-[#9a7d62] to-[#8C636A] bg-clip-text text-transparent hover:from-[#8C636A] hover:to-[#9a7d62] transition-all">
                  Learn more
                </span>
                <span>
                  <ArrowRight className="ml-1 h-4 w-4 text-[#9a7d62]" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ 
        duration: 0.5,
        ease: "easeOut",
        delay: index * 0.1
      }}
    >
      <motion.div 
        className="h-full backdrop-blur-sm bg-white/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] border border-white/20 relative group"
        whileHover={{ y: -10 }}
        style={{
          boxShadow: "0 10px 30px rgba(0,0,0,0.02), inset 0 -1px 0 0 rgba(255,255,255,0.1)"
        }}
      >
        <div className="h-56 overflow-hidden relative">
          <motion.img 
            src={image}
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.7 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="p-8 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#9a7d62]/10 to-transparent rounded-full blur-xl opacity-70 -mt-10 -mr-10"></div>
          
          <motion.h3 
            className="font-bold text-xl text-[#9a7d62] mb-3 tracking-tight relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {title}
          </motion.h3>
          
          <motion.p 
            className="text-gray-600 mb-6 relative z-10 line-clamp-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            {description}
          </motion.p>
          
          <Link href="/services">
            <motion.div
              whileHover={{ x: 5 }}
              className="inline-flex items-center font-medium relative z-10"
            >
              <span className="bg-gradient-to-r from-[#9a7d62] to-[#8C636A] bg-clip-text text-transparent hover:from-[#8C636A] hover:to-[#9a7d62] transition-all">
                Learn more
              </span>
              <motion.span 
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ArrowRight className="ml-1 h-4 w-4 text-[#9a7d62]" />
              </motion.span>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
