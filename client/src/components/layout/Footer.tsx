import { Link } from "wouter";
import { 
  Facebook, 
  Instagram, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  ChevronRight
} from "lucide-react";
import TikTok from "../icons/TikTok";
import { motion } from "framer-motion";

export default function Footer() {
  const footerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <footer className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9a7d62] to-[#8C636A]" />
      
      {/* Glassmorphism effect */}
      <div className="absolute inset-0 backdrop-blur-[100px]"></div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute left-0 top-0 w-96 h-96 rounded-full bg-gradient-to-r from-white/5 to-transparent blur-3xl"
          animate={{
            y: [0, 20, 0],
            x: [0, -10, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-gradient-to-r from-white/10 to-transparent blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        <motion.div
          variants={footerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 drop-shadow-sm">
              Novo<span className="font-light">Pets</span>
            </h2>
            <p className="mb-8 text-white/90 text-lg">
              Premium pet spa and wellness center located in White Plains, Katipunan Avenue, Quezon City, Philippines.
            </p>
            <div className="flex space-x-5">
              <SocialLink Icon={Facebook} href="https://www.facebook.com/profile.php?id=61574721453225" />
              <SocialLink Icon={Instagram} href="https://www.instagram.com/novopetsph/" />
              <SocialLink Icon={TikTok} href="https://www.tiktok.com/@novopetsph" />
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold text-xl mb-8 tracking-wide">Quick Links</h3>
            <ul className="space-y-4">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/services">Services</FooterLink>
              <FooterLink href="/booking">Book Now</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold text-xl mb-8 tracking-wide">Services</h3>
            <ul className="space-y-4">
              <FooterLink href="/services">Luxury Grooming</FooterLink>
              <FooterLink href="/services">Pet Hotel</FooterLink>
              <FooterLink href="/services">Daycare & Playcare</FooterLink>
              <FooterLink href="/services">Pick-up & Drop-off</FooterLink>
              <FooterLink href="/services">Spa Add-Ons</FooterLink>
            </ul>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold text-xl mb-8 tracking-wide">Contact Info</h3>
            <ul className="space-y-6">
              <ContactItem icon={<MapPin className="h-5 w-5" />}>
                Novo Pets, White Plains, Katipunan Avenue, Quezon City, Philippines
              </ContactItem>
              <ContactItem icon={<Phone className="h-5 w-5" />}>
                (0917) 791 7671
              </ContactItem>
              <ContactItem icon={<Mail className="h-5 w-5" />}>
                novopetsph@gmail.com
              </ContactItem>
              <ContactItem icon={<Clock className="h-5 w-5" />}>
                9 AM - 6 PM (Last Call: 5 PM)
              </ContactItem>
            </ul>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white/60 text-sm">&copy; {new Date().getFullYear()} Novo Pets. All rights reserved.</p>
          <div className="mt-6 md:mt-0 flex space-x-8">
            <a href="#" className="text-sm text-white/60 hover:text-white transition-colors duration-300">Privacy Policy</a>
            <a href="#" className="text-sm text-white/60 hover:text-white transition-colors duration-300">Terms of Service</a>
            <a href="#" className="text-sm text-white/60 hover:text-white transition-colors duration-300">Sitemap</a>
          </div>
        </motion.div>
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
    <motion.a 
      href={href} 
      className="h-12 w-12 rounded-full backdrop-blur-md bg-white/10 flex items-center justify-center hover:bg-white/20 border border-white/10 transition-all duration-300"
      whileHover={{ 
        scale: 1.1,
        backgroundColor: "rgba(255, 255, 255, 0.2)"
      }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="h-5 w-5" />
    </motion.a>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Link href={href}>
        <a className="flex items-center text-white/80 hover:text-white transition-colors duration-300 group">
          <ChevronRight className="h-4 w-0 opacity-0 mr-0 group-hover:w-4 group-hover:opacity-100 group-hover:mr-1 transition-all duration-300" />
          {children}
        </a>
      </Link>
    </motion.li>
  );
}

interface ContactItemProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ContactItem({ icon, children }: ContactItemProps) {
  return (
    <motion.li 
      className="flex items-start gap-4 group"
      whileHover={{ x: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="backdrop-blur-sm bg-white/10 p-3 rounded-full border border-white/10 text-white group-hover:bg-white/20 transition-colors duration-300">
        {icon}
      </div>
      <span className="text-white/90 pt-1.5">{children}</span>
    </motion.li>
  );
}
