import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapContainer from "./MapContainer";

export default function Map() {
  return (
    <div className="w-full bg-white rounded-lg overflow-hidden shadow-md h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-montserrat font-semibold text-lg">Our Location</h3>
      </div>
      
      <div className="flex-grow p-0">
        <MapContainer height="400px" className="w-full" />
      </div>
    </div>
  );
}
