import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";

interface PriceTableProps {
  data: any[];
  type: "grooming" | "hotel" | "daycare" | "transport" | "treats";
  activeSize?: string;
}

export default function PriceTable({ data, type, activeSize = "all" }: PriceTableProps) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8">No pricing information available</div>;
  }

  // Filter the data based on active size if applicable
  const filteredData = activeSize === "all" 
    ? data 
    : data.filter(item => {
        if (type === "grooming" || type === "hotel") {
          // These types have size-based pricing
          return true; // We'll handle this by conditionally showing columns
        }
        // For daycare, we filter rows
        if (type === "daycare") {
          return item.size.toLowerCase() === activeSize;
        }
        return true;
      });

  // Render different tables based on the type
  if (type === "grooming") {
    return (
      <Table>
        <TableHeader className="bg-[#8C636A]">
          <TableRow>
            <TableHead className="text-white">Service</TableHead>
            {(activeSize === "all" || activeSize === "small") && (
              <TableHead className="text-white text-center">Small<br/>Breeds (₱)</TableHead>
            )}
            {(activeSize === "all" || activeSize === "medium") && (
              <TableHead className="text-white text-center">Medium<br/>Breeds (₱)</TableHead>
            )}
            {(activeSize === "all" || activeSize === "large") && (
              <TableHead className="text-white text-center">Large<br/>Breeds (₱)</TableHead>
            )}
            {(activeSize === "all" || activeSize === "giant") && (
              <TableHead className="text-white text-center">Giant<br/>Breeds (₱)</TableHead>
            )}
            <TableHead className="text-white text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="text-sm font-medium text-gray-900">{item.service}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </TableCell>
              {(activeSize === "all" || activeSize === "small") && (
                <TableCell className="text-center text-sm">{formatPrice(item.small)}</TableCell>
              )}
              {(activeSize === "all" || activeSize === "medium") && (
                <TableCell className="text-center text-sm">{formatPrice(item.medium)}</TableCell>
              )}
              {(activeSize === "all" || activeSize === "large") && (
                <TableCell className="text-center text-sm">{formatPrice(item.large)}</TableCell>
              )}
              {(activeSize === "all" || activeSize === "giant") && (
                <TableCell className="text-center text-sm">{formatPrice(item.giant)}</TableCell>
              )}
              <TableCell className="text-right text-sm">
                <Link href="/booking">
                  <a className="text-[#8C636A] hover:text-[#8C636A]/80">Book</a>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (type === "hotel") {
    return (
      <Table>
        <TableHeader className="bg-[#8C636A]">
          <TableRow>
            <TableHead className="text-white">Accommodation Type</TableHead>
            {(activeSize === "all" || activeSize === "small") && (
              <TableHead className="text-white text-center">Small<br/>(₱/day)</TableHead>
            )}
            {(activeSize === "all" || activeSize === "medium") && (
              <TableHead className="text-white text-center">Medium<br/>(₱/day)</TableHead>
            )}
            {(activeSize === "all" || activeSize === "large") && (
              <TableHead className="text-white text-center">Large<br/>(₱/day)</TableHead>
            )}
            <TableHead className="text-white text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="text-sm font-medium text-gray-900">{item.type}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </TableCell>
              {(activeSize === "all" || activeSize === "small") && (
                <TableCell className="text-center text-sm">{formatPrice(item.small)}</TableCell>
              )}
              {(activeSize === "all" || activeSize === "medium") && (
                <TableCell className="text-center text-sm">{formatPrice(item.medium)}</TableCell>
              )}
              {(activeSize === "all" || activeSize === "large") && (
                <TableCell className="text-center text-sm">{formatPrice(item.large)}</TableCell>
              )}
              <TableCell className="text-right text-sm">
                <Link href="/booking">
                  <a className="text-[#8C636A] hover:text-[#8C636A]/80">Book</a>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (type === "daycare") {
    return (
      <Table>
        <TableHeader className="bg-[#8C636A]">
          <TableRow>
            <TableHead className="text-white">Pet Size</TableHead>
            <TableHead className="text-white text-center">Hourly Rate (₱)</TableHead>
            <TableHead className="text-white">Notes</TableHead>
            <TableHead className="text-white text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="text-sm font-medium text-gray-900">{item.size}</TableCell>
              <TableCell className="text-center text-sm">{formatPrice(item.rate)}</TableCell>
              <TableCell className="text-sm text-gray-500">{item.notes}</TableCell>
              <TableCell className="text-right text-sm">
                <Link href="/booking">
                  <a className="text-[#8C636A] hover:text-[#8C636A]/80">Book</a>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (type === "transport") {
    return (
      <Table>
        <TableHeader className="bg-[#8C636A]">
          <TableRow>
            <TableHead className="text-white">Service</TableHead>
            <TableHead className="text-white text-center">Price (₱)</TableHead>
            <TableHead className="text-white">Notes</TableHead>
            <TableHead className="text-white text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="text-sm font-medium text-gray-900">{item.service}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </TableCell>
              <TableCell className="text-center text-sm">{formatPrice(item.price)}</TableCell>
              <TableCell className="text-sm text-gray-500">{item.notes}</TableCell>
              <TableCell className="text-right text-sm">
                <Link href="/booking">
                  <a className="text-[#8C636A] hover:text-[#8C636A]/80">Book</a>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (type === "treats") {
    return (
      <Table>
        <TableHeader className="bg-[#8C636A]">
          <TableRow>
            <TableHead className="text-white">Type</TableHead>
            <TableHead className="text-white text-center">Price (₱)</TableHead>
            <TableHead className="text-white">Description</TableHead>
            <TableHead className="text-white text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="text-sm font-medium text-gray-900">{item.type}</TableCell>
              <TableCell className="text-center text-sm">{formatPrice(item.price)}</TableCell>
              <TableCell className="text-sm text-gray-500">{item.description}</TableCell>
              <TableCell className="text-right text-sm">
                <Link href="/booking">
                  <a className="text-[#8C636A] hover:text-[#8C636A]/80">Order</a>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // Default fallback
  return (
    <div className="text-center py-8">Pricing table type not supported</div>
  );
}
