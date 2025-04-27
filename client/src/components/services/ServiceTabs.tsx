import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  PetSize,
  groomingPrices,
  spaAddOns,
  hotelPrices,
  daycarePrices,
  transportPrices,
  treatsPrices
} from "@shared/schema";
import { cn } from "@/lib/utils";

export default function ServiceTabs() {
  const [activeTab, setActiveTab] = useState("grooming");
  const [activeSize, setActiveSize] = useState("all");

  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#9a7d62]">Our Premium Services</h2>
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
          
          {/* Grooming Services */}
          <TabsContent value="grooming">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groomingPrices.map((service, index) => (
                <div key={index} className="bg-[#f8f5f2] p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-2">{service.service}</h3>
                  <p className="text-gray-700 mb-4">{service.description}</p>
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-[#9a7d62]/10 px-2 py-1 text-xs font-medium text-[#9a7d62]">
                      Available for all pet sizes
                    </span>
                  </div>
                  <Link href="/booking">
                    <Button className="w-full bg-[#9a7d62] hover:bg-[#9a7d62]/90">
                      Book This Service
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-playfair font-semibold text-[#9a7d62] mb-4">Exclusive Spa Add-Ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {spaAddOns.map((addon, index) => (
                  <div key={index} className="bg-[#f8f5f2] p-4 rounded-lg shadow">
                    <div className="font-medium text-gray-900">{addon.service}</div>
                    <p className="text-sm text-gray-600 mt-1">Premium spa treatment</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Hotel Services */}
          <TabsContent value="hotel">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hotelPrices.map((service, index) => (
                <div key={index} className="bg-[#f8f5f2] p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-2">{service.type}</h3>
                  <p className="text-gray-700 mb-4">{service.description}</p>
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-[#9a7d62]/10 px-2 py-1 text-xs font-medium text-[#9a7d62]">
                      Daily rates available
                    </span>
                  </div>
                  <Link href="/booking">
                    <Button className="w-full bg-[#9a7d62] hover:bg-[#9a7d62]/90">
                      Book This Service
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
              <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-4">What to Bring for Your Pet's Stay</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="flex items-start">
                  <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                  <span>Your pet's regular food to maintain their routine</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                  <span>Any medications they may need during their stay</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                  <span>A favorite toy or blanket for comfort and familiarity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                  <span>Detailed care instructions and emergency contact information</span>
                </li>
              </ul>
            </div>
          </TabsContent>
          
          {/* Daycare Services */}
          <TabsContent value="daycare">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-[#f8f5f2] p-6 rounded-lg shadow-md">
                <div className="mb-4 overflow-hidden rounded-md h-64">
                  <img 
                    src="/images/services/daycare3.jpg" 
                    alt="Pets in daycare" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-2">Daily Daycare Service</h3>
                <p className="text-gray-700 mb-4">
                  Our daycare services provide a safe, supervised environment where your pet can socialize, play, and exercise while you're away. 
                  We ensure your pet stays happy, engaged, and well-cared for throughout the day.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-[#9a7d62] mb-2">Activities Include:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Supervised play time in our spacious play areas</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Socialization with other pets of similar size and temperament</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Outdoor exercise (weather permitting)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#9a7d62] mb-2">Service Details:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Available for all pet sizes</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Hourly rates with a 3-hour minimum</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Specialized care for different pet needs</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <Link href="/booking">
                  <Button className="w-full bg-[#9a7d62] hover:bg-[#9a7d62]/90">
                    Book Daycare
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>
          
          {/* Transport Services */}
          <TabsContent value="transport">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transportPrices.map((service, index) => (
                <div key={index} className="bg-[#f8f5f2] p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-2">{service.service}</h3>
                  <p className="text-gray-700 mb-4">{service.description}</p>
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-[#9a7d62]/10 px-2 py-1 text-xs font-medium text-[#9a7d62]">
                      {service.notes}
                    </span>
                  </div>
                  <Link href="/booking">
                    <Button className="w-full bg-[#9a7d62] hover:bg-[#9a7d62]/90">
                      Book This Service
                    </Button>
                  </Link>
                </div>
              ))}
              
              <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md mt-4">
                <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-4">Transport Service Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#9a7d62]/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#9a7d62]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold">Time-Saving</h4>
                    <p className="text-sm text-gray-600">Save valuable time in your busy schedule</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#9a7d62]/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#9a7d62]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold">Safe Travel</h4>
                    <p className="text-sm text-gray-600">Comfortable, secure transportation for your pet</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#9a7d62]/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#9a7d62]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold">Reduced Stress</h4>
                    <p className="text-sm text-gray-600">Less stressful experience for anxious pets</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Treats Services */}
          <TabsContent value="treats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {treatsPrices.map((treat, index) => (
                <div key={index} className="bg-[#f8f5f2] p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-2">{treat.type}</h3>
                  <p className="text-gray-700 mb-4">{treat.description}</p>
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-[#9a7d62]/10 px-2 py-1 text-xs font-medium text-[#9a7d62]">
                      Premium Quality
                    </span>
                  </div>
                  <Link href="/booking">
                    <Button className="w-full bg-[#9a7d62] hover:bg-[#9a7d62]/90">
                      Order Now
                    </Button>
                  </Link>
                </div>
              ))}
              
              <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md mt-4">
                <h3 className="text-xl font-playfair font-bold text-[#9a7d62] mb-4">About Our Frozen Yogurt Treats</h3>
                <p className="text-gray-700 mb-6">
                  Our specially formulated frozen yogurt treats are made with all-natural, pet-safe ingredients that not only 
                  taste delicious but also provide health benefits for your furry friends. These treats are perfect as a reward 
                  after grooming or simply as a special indulgence for your beloved pet.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-[#9a7d62] mb-2">Health Benefits</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Probiotics for digestive health</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Low-fat and pet-friendly formulation</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>No artificial colors or flavors</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#9a7d62] mb-2">Available Options</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Pet-specific formulations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Human-grade options available</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Premium flavors with specialty toppings</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#9a7d62] mb-2">Perfect For</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Post-grooming rewards</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Special occasions and pet birthdays</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#9a7d62] mr-2 mt-1">✓</span>
                        <span>Hot day refreshment for pets and owners</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="text-center mt-12">
          <p className="text-lg text-gray-700 mb-6">Ready to book a service for your pet?</p>
          <Link href="/booking">
            <Button size="lg" className="bg-[#9a7d62] hover:bg-[#9a7d62]/90">
              Book an Appointment
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
