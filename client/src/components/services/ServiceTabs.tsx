import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import PriceTable from "./PriceTable";
import { 
  groomingPrices,
  spaAddOns,
  hotelPrices,
  daycarePrices,
  transportPrices,
  treatsPrices,
  PetSize
} from "@shared/schema";
import { cn } from "@/lib/utils";

export default function ServiceTabs() {
  const [activeTab, setActiveTab] = useState("grooming");
  const [activeSize, setActiveSize] = useState("all");

  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62]">Our Services & Pricing</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Tailored services to meet your pet's specific needs</p>
        </div>
        
        <Tabs 
          defaultValue="grooming" 
          className="w-full"
          onValueChange={setActiveTab}
        >
          <div className="flex flex-wrap justify-center mb-8 border-b border-gray-200">
            <TabsList className="bg-transparent h-auto p-0 flex flex-wrap justify-center">
              <TabsTrigger 
                value="grooming" 
                className={cn(
                  "px-6 py-3 font-montserrat data-[state=active]:border-b-2 data-[state=active]:border-[#9a7d62] data-[state=active]:text-[#9a7d62] rounded-none h-auto",
                  activeTab === "grooming" ? "border-b-2 border-[#9a7d62] text-[#9a7d62]" : "text-gray-500 hover:text-[#9a7d62]"
                )}
              >
                Grooming
              </TabsTrigger>
              <TabsTrigger 
                value="hotel" 
                className={cn(
                  "px-6 py-3 font-montserrat data-[state=active]:border-b-2 data-[state=active]:border-[#9a7d62] data-[state=active]:text-[#9a7d62] rounded-none h-auto",
                  activeTab === "hotel" ? "border-b-2 border-[#9a7d62] text-[#9a7d62]" : "text-gray-500 hover:text-[#9a7d62]"
                )}
              >
                Pet Hotel
              </TabsTrigger>
              <TabsTrigger 
                value="daycare" 
                className={cn(
                  "px-6 py-3 font-montserrat data-[state=active]:border-b-2 data-[state=active]:border-[#9a7d62] data-[state=active]:text-[#9a7d62] rounded-none h-auto",
                  activeTab === "daycare" ? "border-b-2 border-[#9a7d62] text-[#9a7d62]" : "text-gray-500 hover:text-[#9a7d62]"
                )}
              >
                Daycare
              </TabsTrigger>
              <TabsTrigger 
                value="transport" 
                className={cn(
                  "px-6 py-3 font-montserrat data-[state=active]:border-b-2 data-[state=active]:border-[#9a7d62] data-[state=active]:text-[#9a7d62] rounded-none h-auto",
                  activeTab === "transport" ? "border-b-2 border-[#9a7d62] text-[#9a7d62]" : "text-gray-500 hover:text-[#9a7d62]"
                )}
              >
                Transport
              </TabsTrigger>
              <TabsTrigger 
                value="treats" 
                className={cn(
                  "px-6 py-3 font-montserrat data-[state=active]:border-b-2 data-[state=active]:border-[#9a7d62] data-[state=active]:text-[#9a7d62] rounded-none h-auto",
                  activeTab === "treats" ? "border-b-2 border-[#9a7d62] text-[#9a7d62]" : "text-gray-500 hover:text-[#9a7d62]"
                )}
              >
                Treats
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Service Filter for relevant tabs */}
          {(activeTab === "grooming" || activeTab === "hotel") && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <SizeFilterButton 
                  size="all" 
                  label="All Sizes" 
                  active={activeSize === "all"} 
                  position="left"
                  onClick={() => setActiveSize("all")}
                />
                <SizeFilterButton 
                  size={PetSize.SMALL} 
                  label="Small" 
                  active={activeSize === PetSize.SMALL} 
                  onClick={() => setActiveSize(PetSize.SMALL)}
                />
                <SizeFilterButton 
                  size={PetSize.MEDIUM} 
                  label="Medium" 
                  active={activeSize === PetSize.MEDIUM} 
                  onClick={() => setActiveSize(PetSize.MEDIUM)}
                />
                <SizeFilterButton 
                  size={PetSize.LARGE} 
                  label="Large" 
                  active={activeSize === PetSize.LARGE} 
                  onClick={() => setActiveSize(PetSize.LARGE)}
                />
                <SizeFilterButton 
                  size={PetSize.GIANT} 
                  label="Giant" 
                  active={activeSize === PetSize.GIANT} 
                  position="right"
                  onClick={() => setActiveSize(PetSize.GIANT)}
                />
              </div>
            </div>
          )}
          
          <TabsContent value="grooming">
            <div className="overflow-x-auto rounded-lg shadow">
              <PriceTable 
                data={groomingPrices} 
                type="grooming" 
                activeSize={activeSize}
              />
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-4">Exclusive Spa Add-Ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {spaAddOns.map((addon, index) => (
                  <div key={index} className="bg-[#f8f5f2] p-4 rounded-lg shadow">
                    <div className="font-medium text-gray-900">{addon.service}</div>
                    <div className="text-sm text-gray-500 mt-1">{addon.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="hotel">
            <div className="overflow-x-auto rounded-lg shadow">
              <PriceTable 
                data={hotelPrices} 
                type="hotel" 
                activeSize={activeSize}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="daycare">
            <div className="overflow-x-auto rounded-lg shadow">
              <PriceTable 
                data={daycarePrices} 
                type="daycare"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="transport">
            <div className="overflow-x-auto rounded-lg shadow">
              <PriceTable 
                data={transportPrices} 
                type="transport"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="treats">
            <div className="overflow-x-auto rounded-lg shadow">
              <PriceTable 
                data={treatsPrices} 
                type="treats"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

interface SizeFilterButtonProps {
  size: string;
  label: string;
  active: boolean;
  position?: "left" | "right";
  onClick: () => void;
}

function SizeFilterButton({ size, label, active, position, onClick }: SizeFilterButtonProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium",
        active 
          ? "text-white bg-[#9a7d62]" 
          : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-100",
        position === "left" ? "rounded-l-lg" : "",
        position === "right" ? "rounded-r-lg" : "",
        !position ? "border-t border-b border-r" : ""
      )}
    >
      {label}
    </button>
  );
}
