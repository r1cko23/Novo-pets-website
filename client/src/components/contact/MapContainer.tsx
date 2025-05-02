import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapContainerProps {
  showOverlay?: boolean;
  aspectRatio?: number;
  height?: string;
  className?: string;
}

export default function MapContainer({
  showOverlay = true,
  aspectRatio = 16/9,
  height = "400px",
  className = ""
}: MapContainerProps) {
  const address = "Novo Pets, White Plains, Katipunan Avenue, Quezon City, Philippines";
  const googleMapsUrl = "https://www.google.com.ph/maps/place/Novo+Pets/@14.6022676,121.0664216,17z/data=!3m1!4b1!4m6!3m5!1s0x3397b7b2ea56c795:0x4fde4fc507703961!8m2!3d14.6022676!4d121.0689965!16s%2Fg%2F11xcldpfzl?entry=ttu";
  
  return (
    <div className={`w-full relative ${className}`} style={{ height, overflow: 'hidden' }}>
      <div className="absolute inset-0">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.941722752742!2d121.06642157423196!3d14.602267581248815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b7b2ea56c795%3A0x4fde4fc507703961!2sNovo%20Pets!5e0!3m2!1sen!2sph!4v1718890246583!5m2!1sen!2sph"
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={false} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Novo Pets Location Map"
        ></iframe>
      </div>
      
      {showOverlay && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#9a7d62]/90 text-white p-4 flex justify-between items-center z-10">
          <div>
            <h3 className="font-montserrat font-semibold text-sm md:text-base flex items-center">
              <MapPin className="h-4 w-4 mr-2" /> 
              Novo Pets, White Plains, Katipunan Avenue
            </h3>
            <p className="text-xs md:text-sm opacity-90">Quezon City, Philippines</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white hover:bg-white/90 text-[#9a7d62] border-white"
            onClick={() => window.open(googleMapsUrl, "_blank")}
          >
            Get Directions
          </Button>
        </div>
      )}
    </div>
  );
} 