"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

// Truck type definition
interface Truck {
  id: number | string;
  make: string;
  model: string;
  year: number;
  miles: number;
  price: number;
  location: string;
  condition: string;
  daysListed: number;
  truckPaperUrl: string;
  horsepower?: string;
  transmission?: string;
  transmissionManufacturer?: string;
  engineManufacturer?: string;
  engineModel?: string;
  cab?: string;
}

// Filter type definition
interface TruckFilters {
  makes?: string[];
  models?: string[];
  year?: { value: number; delta: number };
  miles?: { value: number; delta: number };
  horsepower?: { value: number; delta: number };
  transmission?: string[];
  transmissionManufacturer?: string[];
  engineManufacturer?: string[];
  engineModel?: string[];
  cab?: string[];
  states?: string[];
}

// Updated mock data for semi truck makes and models
const truckMakeModels: Record<string, Array<{ value: string; label: string }>> = {
  freightliner: [
    { value: "cascadia", label: "Cascadia" },
    { value: "coronado", label: "Coronado" },
    { value: "columbia", label: "Columbia" },
    { value: "m2-106", label: "M2 106" },
    { value: "m2-112", label: "M2 112" },
  ],
  peterbilt: [
    { value: "389", label: "389" },
    { value: "379", label: "379" },
    { value: "579", label: "579" },
    { value: "567", label: "567" },
    { value: "387", label: "387" },
  ],
  kenworth: [
    { value: "t680", label: "T680" },
    { value: "t800", label: "T800" },
    { value: "w900", label: "W900" },
    { value: "t660", label: "T660" },
    { value: "t700", label: "T700" },
  ],
  volvo: [
    { value: "vnl-300", label: "VNL 300" },
    { value: "vnl-670", label: "VNL 670" },
    { value: "vnl-780", label: "VNL 780" },
    { value: "vnl-860", label: "VNL 860" },
    { value: "vnr", label: "VNR" },
  ],
  international: [
    { value: "prostar", label: "ProStar" },
    { value: "lonestar", label: "LoneStar" },
    { value: "lt", label: "LT Series" },
    { value: "hx", label: "HX Series" },
    { value: "rv", label: "RV Series" },
  ],
  mack: [
    { value: "anthem", label: "Anthem" },
    { value: "pinnacle", label: "Pinnacle" },
    { value: "granite", label: "Granite" },
    { value: "ch", label: "CH" },
    { value: "cl", label: "CL" },
  ],
  "western-star": [
    { value: "4900", label: "4900" },
    { value: "5700", label: "5700" },
    { value: "4800", label: "4800" },
    { value: "4700", label: "4700" },
    { value: "6900", label: "6900" },
  ],
}

// Updated locations for variety - typical semi truck sales locations
const locations = [
  "Dallas, TX",
  "Chicago, IL",
  "Atlanta, GA",
  "Los Angeles, CA",
  "Oklahoma City, OK",
  "Columbus, OH",
  "Memphis, TN",
  "Salt Lake City, UT",
  "Kansas City, MO",
  "Little Rock, AR",
]

// Function to generate a random truck based on filters
const generateRandomTruck = (id: number, filters: TruckFilters): Truck => {
  // Default values if no filters are applied - updated for semi trucks
  let makes = Object.keys(truckMakeModels)
  let models = []
  let yearMin = 2015
  let yearMax = 2022
  let milesMin = 200000
  let milesMax = 700000

  // Apply make filter if specified
  if (filters.makes && filters.makes.length > 0) {
    makes = filters.makes
  }

  // Select a random make from the filtered list
  const make = makes[Math.floor(Math.random() * makes.length)]

  // Get available models for the selected make
  const availableModels = truckMakeModels[make] || []

  // Apply model filter if specified
  if (filters.models && filters.models.length > 0) {
    // Find models that match both the selected make and the filter
    const makeModels = availableModels.map((m) => m.value)
    const filteredModels = filters.models.filter((m) => makeModels.includes(m))

    // If there are matching models, use them; otherwise use all models for the make
    if (filteredModels.length > 0) {
      models = filteredModels
    } else {
      models = makeModels
    }
  } else {
    // No model filter, use all models for the selected make
    models = availableModels.map((m) => m.value)
  }

  // If no models are available (shouldn't happen), use a default
  if (models.length === 0) {
    models = ["default"]
  }

  // Select a random model from the filtered list
  const modelValue = models[Math.floor(Math.random() * models.length)]
  const modelObj = availableModels.find((m) => m.value === modelValue) || { value: modelValue, label: modelValue }

  // Apply year filter if specified
  if (filters.year) {
    yearMin = filters.year.value - filters.year.delta
    yearMax = filters.year.value + filters.year.delta
  }

  // Apply miles filter if specified
  if (filters.miles) {
    milesMin = filters.miles.value - filters.miles.delta
    milesMax = filters.miles.value + filters.miles.delta
  }

  // Generate random values within the filtered ranges
  const year = Math.floor(yearMin + Math.random() * (yearMax - yearMin + 1))
  const miles = Math.floor(milesMin + Math.random() * (milesMax - milesMin + 1))

  // Calculate a realistic price based on year and miles for semi trucks
  // Semi trucks have much higher base prices than pickup trucks
  const basePrice = 85000 + (year - 2015) * 8000 - (miles / 100000) * 10000 + Math.random() * 15000
  const price = Math.max(35000, Math.round(basePrice / 1000) * 1000) // Round to nearest $1000

  const location = locations[Math.floor(Math.random() * locations.length)]
  const daysListed = 1 + Math.floor(Math.random() * 45) // Semi trucks typically stay on market longer
  
  // Updated conditions for semi trucks
  const conditions = ["Excellent", "Good", "Average", "Fair"]
  const condition = conditions[Math.floor(Math.random() * conditions.length)]

  // Get the display label for the make - properly capitalize, including Western-Star
  let makeLabel
  if (make === "western-star") {
    makeLabel = "Western Star"
  } else {
    makeLabel = make.charAt(0).toUpperCase() + make.slice(1)
  }

  // Random URLs for different semi trucks on TruckPaper
  const truckPaperUrls = [
    "https://www.truckpaper.com/listing/for-sale/242838377/2022-kenworth-t680-sleeper-trucks",
    "https://www.truckpaper.com/listing/for-sale/242773426/2021-peterbilt-389-sleeper-trucks",
    "https://www.truckpaper.com/listing/for-sale/242896172/2020-freightliner-cascadia-126-sleeper-trucks",
    "https://www.truckpaper.com/listing/for-sale/242850138/2019-volvo-vnl64t-760-sleeper-trucks",
    "https://www.truckpaper.com/listing/for-sale/243035265/2018-mack-anthem-sleeper-trucks"
  ]

  return {
    id,
    make: makeLabel,
    model: modelObj.label,
    year,
    miles,
    price,
    location,
    condition,
    daysListed,
    truckPaperUrl: truckPaperUrls[Math.floor(Math.random() * truckPaperUrls.length)],
    horsepower: "",
    transmission: "",
    transmissionManufacturer: "",
    engineManufacturer: "",
    engineModel: "",
    cab: ""
  }
}

interface TruckListProps {
  refreshTrigger?: number;
  filters?: TruckFilters;
  trucks?: Truck[];
  disableExternalFetching?: boolean;
}

export default function TruckList({ 
  refreshTrigger = 0, 
  filters = {}, 
  trucks: propTrucks = [], 
  disableExternalFetching = false 
}: TruckListProps) {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [allTrucks, setAllTrucks] = useState<Truck[]>([]) // Store all trucks for client-side pagination
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Initialize with trucks from props if available
  useEffect(() => {
    if (disableExternalFetching) {
      // Use trucks from props when external fetching is disabled
      setAllTrucks(propTrucks || []);
      setTotalItems(propTrucks?.length || 0);
      setTotalPages(Math.ceil((propTrucks?.length || 0) / pageSize));
      
      // Set current page of trucks
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setTrucks(propTrucks?.slice(startIndex, endIndex) || []);
    }
  }, [propTrucks, disableExternalFetching, currentPage, pageSize]);

  // Remove currentPage and pageSize from the dependency array to prevent API calls on pagination
  useEffect(() => {
    // Skip API fetching if it's disabled
    if (disableExternalFetching) {
      return;
    }
    
    const fetchTrucks = async () => {
      try {
        setLoading(true);
        
        // Call the server-side API endpoint
        const response = await fetch('/api/trucks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            filters,
            // Don't include pagination here - we'll handle it client-side
            // pagination: {
            //   page: currentPage,
            //   pageSize: pageSize
            // }
          }),
        });
        
        const data = await response.json();
        
        if (data.success && data.trucks && data.trucks.length > 0) {
          // Map the fetched trucks to the expected format
          const formattedTrucks: Truck[] = data.trucks.map((truck: any, index: number) => ({
            id: truck.id || index + 1,
            make: truck.manufacturer || "",
            model: truck.model || "",
            year: truck.year || 0,
            miles: truck.mileage || 0,
            price: truck.retail_price || 0,
            location: truck.truck_location || "Unknown",
            condition: truck.condition || "Unknown",
            daysListed: truck.daysListed || Math.floor(Math.random() * 45) + 1,
            truckPaperUrl: truck.url || "#",
            horsepower: truck.horsepower || "",
            transmission: truck.transmission || "",
            transmissionManufacturer: truck.transmission_manufacturer || "",
            engineManufacturer: truck.engine_manufacturer || "",
            engineModel: truck.engine_model || "",
            cab: truck.cab || ""
          }));
          
          // Store all trucks for client-side pagination if needed
          setAllTrucks(formattedTrucks);
          
          // Set pagination data from API response
          if (data.pagination) {
            setTotalItems(data.pagination.totalItems || formattedTrucks.length);
            setTotalPages(data.pagination.totalPages || Math.ceil(formattedTrucks.length / pageSize));
            
            // If API handles pagination, use the returned trucks directly
            setTrucks(formattedTrucks);
          } else {
            // If API doesn't handle pagination, do it client-side
            setTotalItems(formattedTrucks.length);
            setTotalPages(Math.ceil(formattedTrucks.length / pageSize));
            
            // Manually paginate
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            setTrucks(formattedTrucks.slice(startIndex, endIndex));
          }
        } else {
          // Fallback to generating random trucks if no results
          const totalTrucks = 15; // Generate enough for a few pages
          const newTrucks: Truck[] = Array(totalTrucks)
            .fill(null)
            .map((_, index) => generateRandomTruck(index + 1, filters));
            
          setAllTrucks(newTrucks);
          setTotalItems(newTrucks.length);
          setTotalPages(Math.ceil(newTrucks.length / pageSize));
          
          // Paginate the generated trucks
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          setTrucks(newTrucks.slice(startIndex, endIndex));
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching trucks:", err);
        setError("Failed to load truck data");
        
        // Fallback to generating random trucks on error
        const totalTrucks = 15; // Generate enough for a few pages
        const newTrucks: Truck[] = Array(totalTrucks)
          .fill(null)
          .map((_, index) => generateRandomTruck(index + 1, filters));
          
        setAllTrucks(newTrucks);
        setTotalItems(newTrucks.length);
        setTotalPages(Math.ceil(newTrucks.length / pageSize));
        
        // Paginate the generated trucks
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setTrucks(newTrucks.slice(startIndex, endIndex));
      } finally {
        setLoading(false);
        
        // Add visual indication that the data has changed
        setTimeout(() => {
          const rows = document.querySelectorAll("tbody tr");
          rows.forEach((row) => {
            row.classList.add("bg-green-50");
            setTimeout(() => {
              row.classList.remove("bg-green-50");
            }, 1000);
          });
        }, 100);
      }
    };
    
    fetchTrucks();
  }, [refreshTrigger, filters, disableExternalFetching]);

  // Add a separate effect for client-side pagination
  useEffect(() => {
    // Only handle pagination client-side if we have the trucks data already
    if (allTrucks.length > 0) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setTrucks(allTrucks.slice(startIndex, endIndex));
    }
  }, [currentPage, pageSize, allTrucks]);

  // Handle page change - only use client-side pagination when external fetching is disabled
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      
      // If external fetching is disabled or we have all trucks loaded, paginate client-side
      if (disableExternalFetching || allTrucks.length > 0) {
        const startIndex = (newPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setTrucks(allTrucks.slice(startIndex, endIndex));
      }
      // Otherwise, the page change will trigger the useEffect for API fetching
    }
  };

  // Handle page size change - update client-side pagination if external fetching is disabled
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
    
    // Update pagination calculations and data
    if (disableExternalFetching || allTrucks.length > 0) {
      setTotalPages(Math.ceil(allTrucks.length / newSize));
      setTrucks(allTrucks.slice(0, newSize));
    }
    // Otherwise, the page size change will trigger the useEffect for API fetching
  };

  return (
    <div className="space-y-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Make/Model</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Miles</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Show loading state
              Array(pageSize).fill(null).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell colSpan={6} className="text-center py-4">
                    <div className="flex justify-center items-center h-6 opacity-50">
                      <div className="animate-pulse h-4 w-32 bg-muted rounded"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : trucks && trucks.length > 0 ? (
              trucks.map((truck) => (
                <TableRow key={truck.id} className="transition-colors duration-300">
                  <TableCell className="font-medium">
                    <div>
                      {truck.make || truck.manufacturer} {truck.model}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {truck.condition}
                      </Badge>
                      {(truck.horsepower || truck.engine_model) && (
                        <Badge variant="outline" className="text-xs">
                          {truck.horsepower || truck.engine_model}
                        </Badge>
                      )}
                      {truck.cab && (
                        <Badge variant="outline" className="text-xs">
                          {truck.cab}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{truck.year}</TableCell>
                  <TableCell>{truck.miles || truck.mileage}</TableCell>
                  <TableCell>{truck.price || truck.retail_price}</TableCell>
                  <TableCell>{truck.location || truck.truck_location}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                    >
                      <a 
                        href={truck.truckPaperUrl || truck.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No trucks found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <select 
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={loading}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show pages around current page
                let pageNum = currentPage;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

