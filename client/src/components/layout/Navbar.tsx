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
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-center">
          <div className="glass px-6 py-2 rounded-full flex items-center w-full max-w-4xl justify-between">
            <Link href="/">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-16 w-16 flex items-center justify-center bg-white rounded-full">
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
                <Button size="sm" className="rounded-full bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
                  Book an Appointment
                </Button>
              </Link>
            </div>
            
            <div className="block md:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
                className="text-brand-primary"
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
              className="md:hidden glass rounded-2xl mt-2 overflow-hidden z-[100]"
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
                
                <div className="pt-4">
                  <Link href="/booking">
                    <Button size="sm" className="w-full rounded-full bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white" onClick={closeMobileMenu}>
                      Book an Appointment
                    </Button>
                  </Link>
                </div>
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
      <span
        className={cn(
          "text-sm font-medium transition-colors hover:text-brand-primary cursor-pointer",
          active 
            ? "text-brand-primary" 
            : "text-foreground/80 hover:text-brand-primary"
        )}
      >
        {children}
      </span>
    </Link>
  );
}

function MobileNavLink({ href, active, children, onClick }: NavLinkProps) {
  return (
    <Link href={href} onClick={onClick}>
      <span
        className={cn(
          "block px-3 py-2 text-base font-medium rounded-md transition-colors cursor-pointer",
          active 
            ? "bg-brand-primary/10 text-brand-primary" 
            : "text-foreground/80 hover:bg-brand-primary/5 hover:text-brand-primary"
        )}
      >
        {children}
      </span>
    </Link>
  );
}
