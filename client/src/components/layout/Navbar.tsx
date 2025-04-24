import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import novoLogo from "../../assets/Novos logo final.png";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll events for adding shadow
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location === path;
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="relative">
      <nav className={cn(
        "bg-[#faf7ee] fixed w-full z-50 transition-all duration-300",
        scrolled ? "shadow-md" : ""
      )}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <img 
                    src={novoLogo} 
                    alt="Novo Pets" 
                    className="h-12 w-auto" 
                  />
                </Link>
              </div>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
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
            </div>
            <div className="flex items-center">
              <Link href="/booking">
                <Button 
                  className="hidden md:block bg-[#8C636A] hover:bg-[#8C636A]/90 text-white"
                >
                  Book an Appointment
                </Button>
              </Link>
            </div>
            <div className="flex items-center md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-[#8C636A]" />
                ) : (
                  <Menu className="h-6 w-6 text-[#8C636A]" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`md:hidden bg-[#faf7ee] ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
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
          <div className="pt-4 pb-3 border-t border-[#e3dcd9]">
            <Link href="/booking" onClick={closeMobileMenu}>
              <Button className="w-full bg-[#8C636A] hover:bg-[#8C636A]/90 text-white mx-2">
                Book an Appointment
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavLink({ href, active, children, onClick }: NavLinkProps) {
  return (
    <Link href={href} onClick={onClick}>
      <a className={cn(
        "font-montserrat px-1 pt-1 font-medium",
        active 
          ? "text-[#8C636A] border-b-2 border-[#8C636A]" 
          : "text-[#8C636A]/80 hover:text-[#8C636A]"
      )}>
        {children}
      </a>
    </Link>
  );
}

function MobileNavLink({ href, active, children, onClick }: NavLinkProps) {
  return (
    <Link href={href} onClick={onClick}>
      <a className={cn(
        "block px-3 py-2 font-medium",
        active 
          ? "text-[#8C636A]" 
          : "text-[#8C636A]/80 hover:text-[#8C636A]"
      )}>
        {children}
      </a>
    </Link>
  );
}
