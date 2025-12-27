import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { serviceImages } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-transparent w-full z-[100]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center">
          <div className="bg-white px-6 py-2 rounded-full flex items-center shadow-md w-full max-w-4xl justify-between">
            <Link href="/">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-16 w-16 flex items-center justify-center bg-white">
                  <img 
                    src="/logo_final.png" 
                    alt="Novo Pets" 
                    className="h-8 w-8 object-contain" 
                  />
                </div>
              </div>
            </Link>
            
            <div className="hidden md:flex space-x-8">
              <NavLink href="/" active={isActive("/")} onClick={closeMobileMenu}>
                Home
              </NavLink>
              <NavLink href="/about" active={isActive("/about")} onClick={closeMobileMenu}>
                About Us
              </NavLink>
              <NavLink href="/services" active={isActive("/services")} onClick={closeMobileMenu}>
                Services
              </NavLink>
              <NavLink href="/booking" active={isActive("/booking")} onClick={closeMobileMenu}>
                Book Now
              </NavLink>
              <NavLink href="/contact" active={isActive("/contact")} onClick={closeMobileMenu}>
                Contact
              </NavLink>
            </div>
            
            <div className="md:flex items-center hidden">
              <Link href="/booking">
                <Button className="bg-gradient-to-r from-[#9a7d62] to-[#8C636A] hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm transition-all duration-200">
                  Book an Appointment
                </Button>
              </Link>
            </div>
            
            <div className="block md:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
                className="text-[#9a7d62]"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white/95 backdrop-blur-sm rounded-2xl mt-2 shadow-lg overflow-hidden z-[100]"
            >
              <div className="px-4 py-3 space-y-2">
                <MobileNavLink href="/" active={isActive("/")} onClick={closeMobileMenu}>
                  Home
                </MobileNavLink>
                <MobileNavLink href="/about" active={isActive("/about")} onClick={closeMobileMenu}>
                  About Us
                </MobileNavLink>
                <MobileNavLink href="/services" active={isActive("/services")} onClick={closeMobileMenu}>
                  Services
                </MobileNavLink>
                <MobileNavLink href="/booking" active={isActive("/booking")} onClick={closeMobileMenu}>
                  Book Now
                </MobileNavLink>
                <MobileNavLink href="/contact" active={isActive("/contact")} onClick={closeMobileMenu}>
                  Contact
                </MobileNavLink>
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <Link href="/booking" onClick={closeMobileMenu}>
                  <Button className="w-full bg-gradient-to-r from-[#9a7d62] to-[#8C636A] hover:opacity-90 text-white text-sm font-medium py-2 rounded-full shadow-sm">
                    Book an Appointment
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  scrolled?: boolean;
}

function NavLink({ href, active, children, onClick, scrolled = false }: NavLinkProps) {
  return (
    <Link href={href} onClick={onClick}>
      <a className={cn(
        "font-sans text-sm px-2 py-1 font-medium transition-all duration-200 text-center relative group whitespace-nowrap",
        active 
          ? "text-[#9a7d62] font-semibold" 
          : "text-gray-700 hover:text-[#9a7d62]"
      )}>
        {children}
        <span className={cn(
          "absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#9a7d62] transform -translate-x-1/2 transition-all duration-200",
          active ? "w-1/2" : "group-hover:w-1/3"
        )} />
      </a>
    </Link>
  );
}

function MobileNavLink({ href, active, children, onClick }: NavLinkProps) {
  return (
    <Link href={href} onClick={onClick}>
      <a className={cn(
        "block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
        active ? "bg-[#9a7d62]/10 text-[#9a7d62] font-semibold" : "text-gray-700 hover:bg-[#9a7d62]/5 hover:text-[#9a7d62]"
      )}>
        {children}
      </a>
    </Link>
  );
}
