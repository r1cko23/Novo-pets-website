import { Link } from "wouter";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  MapPin, 
  Phone, 
  Mail, 
  Clock 
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#9a7d62] text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h2 className="text-2xl font-playfair font-bold mb-6">
              Novo<span className="text-[#f8f5f2]">Pets</span>
            </h2>
            <p className="mb-6 opacity-80">
              Premium pet spa and wellness center located in White Plains, Katipunan Avenue, Philippines.
            </p>
            <div className="flex space-x-4">
              <SocialLink Icon={Facebook} href="#" />
              <SocialLink Icon={Instagram} href="#" />
              <SocialLink Icon={Twitter} href="#" />
            </div>
          </div>
          
          <div>
            <h3 className="font-montserrat font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/services">Services</FooterLink>
              <FooterLink href="/booking">Book Now</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>
          
          <div>
            <h3 className="font-montserrat font-semibold text-lg mb-6">Services</h3>
            <ul className="space-y-3">
              <FooterLink href="/services">Luxury Grooming</FooterLink>
              <FooterLink href="/services">Pet Hotel</FooterLink>
              <FooterLink href="/services">Daycare & Playcare</FooterLink>
              <FooterLink href="/services">Pick-up & Drop-off</FooterLink>
              <FooterLink href="/services">Spa Add-Ons</FooterLink>
            </ul>
          </div>
          
          <div>
            <h3 className="font-montserrat font-semibold text-lg mb-6">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="mt-1 mr-3 h-5 w-5" />
                <span>White Plains, Katipunan Avenue, Philippines (Caltex WP Fuel Inc.)</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-3 h-5 w-5" />
                <span>09177151609 / 09052510937</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-3 h-5 w-5" />
                <span>novopetsph@gmail.com</span>
              </li>
              <li className="flex items-center">
                <Clock className="mr-3 h-5 w-5" />
                <span>9 AM - 6 PM (Last Call: 5 PM)</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <p className="opacity-80 text-sm">&copy; {new Date().getFullYear()} Novo Pets. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-sm opacity-80 hover:opacity-100">Privacy Policy</a>
            <a href="#" className="text-sm opacity-80 hover:opacity-100">Terms of Service</a>
            <a href="#" className="text-sm opacity-80 hover:opacity-100">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface SocialLinkProps {
  Icon: typeof Facebook;
  href: string;
}

function SocialLink({ Icon, href }: SocialLinkProps) {
  return (
    <a href={href} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition duration-300">
      <Icon className="h-5 w-5" />
    </a>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <li>
      <Link href={href}>
        <a className="opacity-80 hover:opacity-100 transition duration-300">{children}</a>
      </Link>
    </li>
  );
}
