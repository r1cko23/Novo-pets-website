import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  Clock,
  MapPin,
  Facebook,
  Instagram
} from "lucide-react";
import TikTok from "@/components/icons/TikTok";
import ContactForm from "@/components/contact/ContactForm";
import Map from "@/components/contact/Map";

export default function Contact() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#9a7d62]/10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#9a7d62] mb-6">Contact Us</h1>
            <p className="text-lg text-gray-700">
              Have questions or need assistance? We're here to help! Reach out to our team for prompt and friendly service.
            </p>
          </div>
        </div>
      </section>
      
      {/* Contact Form Section */}
      <section className="py-16 bg-[#f8f5f2]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62]">Contact Us</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions or need assistance? We're here to help!
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="md:flex" style={{ minHeight: "500px" }}>
                <div className="md:w-1/2 md:border-r border-gray-200" style={{ minHeight: "500px" }}>
                  <Map />
                </div>
                
                <div className="md:w-1/2 p-8">
                  <ContactForm />
                  
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-[#9a7d62]/10 text-[#9a7d62]">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="ml-4">
                          <h4 className="font-montserrat font-semibold text-gray-900">Address</h4>
                          <p className="text-gray-600">Novo Pets, White Plains, Katipunan Avenue, Quezon City, Philippines</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-[#9a7d62]/10 text-[#9a7d62]">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div className="ml-4">
                          <h4 className="font-montserrat font-semibold text-gray-900">Phone</h4>
                          <p className="text-gray-600">09177151609 / 09052510937</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-[#9a7d62]/10 text-[#9a7d62]">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="ml-4">
                          <h4 className="font-montserrat font-semibold text-gray-900">Email</h4>
                          <p className="text-gray-600">novopetsph@gmail.com</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-[#9a7d62]/10 text-[#9a7d62]">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="ml-4">
                          <h4 className="font-montserrat font-semibold text-gray-900">Operating Hours</h4>
                          <p className="text-gray-600">9 AM - 6 PM (Last Call: 5 PM)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-12 text-center">Common Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">Do you accept walk-ins?</h3>
              <p className="text-gray-700">
                While we primarily operate by appointment to ensure each pet receives our full attention, we do accept walk-ins based on availability. We recommend calling ahead to check our current schedule.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">What areas do you serve?</h3>
              <p className="text-gray-700">
                Our facility is located in White Plains, and we primarily serve clients in White Plains, St. Ignatius, Corinthian Gardens, and Green Meadows. Our transport service covers a 3km radius from our location.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">What payment methods do you accept?</h3>
              <p className="text-gray-700">
                We accept cash, all major credit cards, bank transfers, and online payment options like GCash and PayMaya for your convenience.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-montserrat font-semibold text-[#9a7d62]">How can I provide feedback about my experience?</h3>
              <p className="text-gray-700">
                We value your feedback! You can share your experience through our contact form, email us directly, or leave a review on our social media pages. We use all feedback to continually improve our services.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Media Section */}
      <section className="py-16 bg-[#9a7d62]/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-6">Connect With Us</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Follow us on social media for pet care tips, special offers, and adorable pet transformations!
          </p>
          
          <div className="flex justify-center space-x-6">
            <a href="https://www.facebook.com/profile.php?id=61574721453225" className="h-12 w-12 rounded-full bg-[#9a7d62] hover:bg-[#9a7d62]/80 flex items-center justify-center text-white transition duration-300">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://www.instagram.com/novopetsph/" className="h-12 w-12 rounded-full bg-[#9a7d62] hover:bg-[#9a7d62]/80 flex items-center justify-center text-white transition duration-300">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://www.tiktok.com/@novopetsph" className="h-12 w-12 rounded-full bg-[#9a7d62] hover:bg-[#9a7d62]/80 flex items-center justify-center text-white transition duration-300">
              <TikTok className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62] mb-6">Ready to Book Your Pet's Appointment?</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Experience the premium pet care services at Novo Pets. Your pet deserves it!
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
              Book an Appointment
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
