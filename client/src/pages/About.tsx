import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#9a7d62]/10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#9a7d62] mb-6">About Novo Pets</h1>
            <p className="text-lg text-gray-700">
              Discover our commitment to providing exceptional care for your beloved pets
              through our premium grooming, hotel, and daycare services.
            </p>
          </div>
        </div>
      </section>
      
      {/* Main Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start gap-12">
            <div className="lg:w-1/2">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1603123853880-a92fafb7809f?q=80&w=1000&auto=format&fit=crop" 
                  alt="Novo Pets Facility" 
                  className="rounded-lg shadow-xl w-full"
                />
                <div className="absolute -bottom-6 -right-6 bg-[#9a7d62]/90 text-white p-6 rounded-lg shadow-lg max-w-xs hidden md:block">
                  <p className="italic font-playfair">"Every pet deserves the royal treatment."</p>
                </div>
              </div>
              
              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#f8f5f2] p-6 rounded-lg shadow">
                  <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-3">Facility Size</h3>
                  <p className="text-gray-700">72 sqm of specially designed spa and wellness space for pets.</p>
                </div>
                <div className="bg-[#f8f5f2] p-6 rounded-lg shadow">
                  <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-3">Expert Staff</h3>
                  <p className="text-gray-700">4 dedicated employees including 2 professional groomers and additional spa care staff.</p>
                </div>
                <div className="bg-[#f8f5f2] p-6 rounded-lg shadow">
                  <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-3">Operating Hours</h3>
                  <p className="text-gray-700">9 AM - 6 PM daily, with last appointments at 5 PM.</p>
                </div>
                <div className="bg-[#f8f5f2] p-6 rounded-lg shadow">
                  <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-3">Service Area</h3>
                  <p className="text-gray-700">Located in White Plains, serving St. Ignatius, Corinthian Gardens, and Green Meadows.</p>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 space-y-8">
              <div>
                <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-4">Our Story</h2>
                <p className="text-gray-700 mb-4">
                  Novo Pets was founded with a simple yet powerful vision: to create a sanctuary where pets receive the same level of luxury and care that high-end human spas provide. Located in the heart of White Plains, Katipunan Avenue, our facility combines elegant aesthetics with functional design to ensure both pets and their owners feel welcome and comfortable.
                </p>
                <p className="text-gray-700">
                  We believe that pets are family members who deserve exceptional care, attention to detail, and a stress-free environment. Every aspect of our space is designed with pet wellness in mind, from our aromatherapy-infused grooming rooms to our comfortable boutique pet hotel accommodations.
                </p>
              </div>
              
              <div>
                <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-4">Our Mission</h2>
                <div className="p-6 bg-[#436e4f]/10 rounded-lg border-l-4 border-[#436e4f] mb-6">
                  <p className="italic text-lg">
                    "To provide top-tier pet care services, ensuring the happiness and well-being of pets and their owners."
                  </p>
                </div>
                <p className="text-gray-700">
                  At Novo Pets, we strive to elevate the standard of pet care by combining expert techniques with a genuine love for animals. Our mission guides every decision we make, from the premium products we select to the continuous training of our staff.
                </p>
              </div>
              
              <div>
                <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-4">Our Vision</h2>
                <div className="p-6 bg-[#9a7d62]/10 rounded-lg border-l-4 border-[#9a7d62] mb-6">
                  <p className="italic text-lg">
                    "To become the leading pet care provider known for our excellence, innovation, and customer-first approach."
                  </p>
                </div>
                <p className="text-gray-700">
                  We envision a future where Novo Pets sets the gold standard for pet care in the Philippines, where our name becomes synonymous with exceptional quality and where pets eagerly look forward to their visits with us.
                </p>
              </div>
              
              <div>
                <h2 className="text-3xl font-playfair font-bold text-[#9a7d62] mb-4">Our Approach</h2>
                <p className="text-gray-700 mb-4">
                  What sets Novo Pets apart is our holistic approach to pet care. We don't just focus on the aesthetic aspects of grooming—we consider the overall well-being of each pet that visits us.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="text-[#9a7d62] mr-2">✓</span>
                    <span>We use premium, pet-safe products that are gentle on sensitive skin.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#9a7d62] mr-2">✓</span>
                    <span>Our staff undergoes continuous training on the latest pet care techniques.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#9a7d62] mr-2">✓</span>
                    <span>We create individualized care plans based on each pet's unique needs.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#9a7d62] mr-2">✓</span>
                    <span>Our stress-free environment includes calming music and aromatherapy.</span>
                  </li>
                </ul>
                <p className="text-gray-700">
                  By combining professional expertise with a genuine love for animals, we ensure that every pet receives the highest standard of care in our stress-free, luxurious environment.
                </p>
              </div>
              
              <div className="pt-6">
                <Link href="/services">
                  <Button className="bg-[#9a7d62] hover:bg-[#9a7d62]/90 text-white">
                    Explore Our Services <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-[#9a7d62]/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62] mb-6">Experience the Novo Pets Difference</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Book an appointment today and discover why pet parents trust us with their beloved companions.
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
