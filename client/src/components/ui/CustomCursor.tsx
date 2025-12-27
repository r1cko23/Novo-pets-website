import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Custom cursor component for 2025 design trends
 * Only shows on desktop devices
 * Optimized with requestAnimationFrame to prevent lag
 */
export default function CustomCursor() {
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile devices
    let resizeTimeout: NodeJS.Timeout | null = null;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkMobile();
    
    // Throttle resize events
    const handleResize = () => {
      if (resizeTimeout) return;
      resizeTimeout = setTimeout(() => {
        checkMobile();
        resizeTimeout = null;
      }, 150);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    if (isMobile) {
      document.body.classList.remove('custom-cursor-active');
      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeout) clearTimeout(resizeTimeout);
      };
    }
    
    // Add class to body to enable custom cursor
    document.body.classList.add('custom-cursor-active');

    // Optimized mouse move handler using requestAnimationFrame
    const updateCursorPosition = () => {
      setMousePosition({
        x: mousePositionRef.current.x,
        y: mousePositionRef.current.y
      });
      animationFrameRef.current = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Update ref immediately (no re-render)
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      
      // Only schedule one animation frame update
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(updateCursorPosition);
      }
    };

    // Efficient hover detection using mouseover/mouseout with event delegation
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('a, button, [role="button"], input, select, textarea, [tabindex]')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('a, button, [role="button"], input, select, textarea, [tabindex]')) {
        setIsHovering(false);
      }
    };

    // Use event delegation on document level (more efficient)
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (resizeTimeout) clearTimeout(resizeTimeout);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-[#9a7d62] rounded-full pointer-events-none z-[9999] mix-blend-difference"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
        }}
      />
      
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border-2 border-[#9a7d62]/30 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
      />
    </>
  );
}

