import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Map() {
  // This would be replaced with an actual Google Maps component
  // For now, we're using a placeholder with a background image
  return (
    <div 
      className="h-full w-full relative" 
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1569336415962-a4bd9f69c07a?q=80&w=900&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '300px'
      }}
    >
      <div className="flex items-center justify-center h-full bg-[#262220]/50 text-white">
        <div className="text-center p-6">
          <MapPin className="h-10 w-10 mx-auto mb-4" />
          <h3 className="font-montserrat font-semibold text-xl mb-2">Our Location</h3>
          <p>White Plains, Katipunan Avenue, Philippines</p>
          <p className="text-sm mt-2">(Address: Caltex WP Fuel Inc.)</p>
          <Button 
            variant="outline" 
            className="mt-4 bg-white hover:bg-white/90 text-[#9a7d62] border-white"
            onClick={() => window.open("https://maps.google.com/?q=White+Plains+Katipunan+Avenue+Philippines", "_blank")}
          >
            Get Directions
          </Button>
        </div>
      </div>
    </div>
  );
}
