import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { serviceOverviewItems } from "@shared/schema";

export default function ServicesOverview() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62]">Our Premium Services</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the finest pet care services designed for your pet's comfort and wellness
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {serviceOverviewItems.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              image={service.image}
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
}

function ServiceCard({ title, description, image }: ServiceCardProps) {
  return (
    <div className="group bg-[#f8f5f2] rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2">
      <div className="h-48 overflow-hidden">
        <img 
          src={image}
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-6">
        <h3 className="font-playfair font-bold text-xl text-[#9a7d62] mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <Link href="/services">
          <a className="inline-block text-[#436e4f] font-medium hover:text-[#9a7d62] transition-colors group">
            Learn more <ArrowRight className="ml-1 h-4 w-4 inline" />
          </a>
        </Link>
      </div>
    </div>
  );
}
