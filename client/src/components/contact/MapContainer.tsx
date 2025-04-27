import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface MapContainerProps {
  showOverlay?: boolean;
  aspectRatio?: number;
  height?: string;
  className?: string;
}

export default function MapContainer({
  showOverlay = true,
  aspectRatio = 16/9,
  height,
  className = ""
}: MapContainerProps) {
  const address = "Caltex WP Fuel Inc, White Plains, Katipunan Avenue, Philippines";
  const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  
  const containerStyle = height ? { height } : {};
  
  return (
    <div className={`w-full relative flex flex-col ${className}`} style={containerStyle}>
      {height ? (
        <div className="w-full h-full relative">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.2267361964193!2d121.07297801744384!3d14.632503899999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b7ae6f9eec0f%3A0x3a3ea4f2222c56ff!2sCaltex%20White%20Plains!5e0!3m2!1sen!2sus!4v1710997384815!5m2!1sen!2sus"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Novo Pets Location Map"
            className="absolute inset-0"
          ></iframe>
          
          {showOverlay && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#9a7d62]/90 text-white p-4 flex justify-between items-center z-10">
              <div>
                <h3 className="font-montserrat font-semibold text-sm md:text-base flex items-center">
                  <MapPin className="h-4 w-4 mr-2" /> 
                  White Plains, Katipunan Avenue
                </h3>
                <p className="text-xs md:text-sm opacity-90">Caltex WP Fuel Inc.</p>
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
      ) : (
        <AspectRatio ratio={aspectRatio} className="flex-grow">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.2267361964193!2d121.07297801744384!3d14.632503899999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b7ae6f9eec0f%3A0x3a3ea4f2222c56ff!2sCaltex%20White%20Plains!5e0!3m2!1sen!2sus!4v1710997384815!5m2!1sen!2sus"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Novo Pets Location Map"
            className="absolute inset-0"
          ></iframe>
          
          {showOverlay && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#9a7d62]/90 text-white p-4 flex justify-between items-center z-10">
              <div>
                <h3 className="font-montserrat font-semibold text-sm md:text-base flex items-center">
                  <MapPin className="h-4 w-4 mr-2" /> 
                  White Plains, Katipunan Avenue
                </h3>
                <p className="text-xs md:text-sm opacity-90">Caltex WP Fuel Inc.</p>
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
        </AspectRatio>
      )}
    </div>
  );
} 