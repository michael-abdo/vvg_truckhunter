"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Loader2, Minus, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import TruckList from "./truck-list"
import PriceChart from "./price-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { queryVinInformation } from "@/lib/mysql"
import { states } from "../app/lib/states"
import TruckSummaryStats from "./truck-summary-stats"

// Add this interface to fix type errors in the filters object
interface ExtendedTruckFilters {
  makes: string[];
  models: string[];
  miles: { value: number; delta: number };
  year: { value: number; delta: number };
  horsepower: { value: number; delta: number };
  transmission: string[];
  transmissionManufacturer: string[];
  engineManufacturer: string[];
  engineModel: string[];
  cab: string[];
  states: string[];
}

export default function TruckFinder() {
  // State for dropdown options from database
  const [truckMakes, setTruckMakes] = useState<Array<{ value: string; label: string }>>([])
  const [truckModels, setTruckModels] = useState<Record<string, Array<{ value: string; label: string }>>>({})
  const [transmissionTypes, setTransmissionTypes] = useState<Array<{ value: string; label: string }>>([])
  const [transmissionManufacturers, setTransmissionManufacturers] = useState<Array<{ value: string; label: string }>>([])
  const [engineManufacturers, setEngineManufacturers] = useState<Array<{ value: string; label: string }>>([])
  const [engineModels, setEngineModels] = useState<Record<string, Array<{ value: string; label: string }>>>({})
  const [cabTypes, setCabTypes] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(true)
  
  // Loading states for buttons
  const [searchLoading, setSearchLoading] = useState(false)
  const [vinSearchLoading, setVinSearchLoading] = useState(false)
  const [applyVinSpecsLoading, setApplyVinSpecsLoading] = useState(false)

  // Existing state variables
  const [selectedMakes, setSelectedMakes] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [makesOpen, setMakesOpen] = useState(false)
  const [modelsOpen, setModelsOpen] = useState(false)
  const [miles, setMiles] = useState(300000)
  const [year, setYear] = useState(2018)
  const [milesDelta, setMilesDelta] = useState(100000)
  const [yearDelta, setYearDelta] = useState(3)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [searchCount, setSearchCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [truckCount, setTruckCount] = useState(67)
  const [activeTab, setActiveTab] = useState("criteria")
  
  // New state for VIN search
  const [vin, setVin] = useState("")
  const [vinSearchPerformed, setVinSearchPerformed] = useState(false)
  const [vinMatchFound, setVinMatchFound] = useState(false)
  const [vinSpecs, setVinSpecs] = useState<any>(null)

  // Update filters state to use the proper type
  const [filters, setFilters] = useState<ExtendedTruckFilters>({
    makes: [],
    models: [],
    miles: { value: 300000, delta: 100000 },
    year: { value: 2018, delta: 3 },
    horsepower: { value: 450, delta: 50 },
    transmission: [],
    transmissionManufacturer: [],
    engineManufacturer: [],
    engineModel: [],
    cab: [],
    states: []
  })

  // Available models based on selected makes
  const availableModels = selectedMakes.flatMap((make) => {
    // Try to find the manufacturer in truckModels with case-insensitive matching
    const matchingKey = Object.keys(truckModels).find(
      key => key.toLowerCase() === make.toLowerCase()
    );
    return matchingKey ? truckModels[matchingKey] : [];
  });

  // Add new state variables for the new filters
  const [horsepower, setHorsepower] = useState(450)
  const [horsepowerDelta, setHorsepowerDelta] = useState(50)
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([])
  const [selectedTransMfrs, setSelectedTransMfrs] = useState<string[]>([])
  const [selectedEngineMfrs, setSelectedEngineMfrs] = useState<string[]>([])
  const [selectedEngineModels, setSelectedEngineModels] = useState<string[]>([])
  const [selectedCabTypes, setSelectedCabTypes] = useState<string[]>([])
  const [transmissionsOpen, setTransmissionsOpen] = useState(false)
  const [transMfrsOpen, setTransMfrsOpen] = useState(false)
  const [engineMfrsOpen, setEngineMfrsOpen] = useState(false)
  const [engineModelsOpen, setEngineModelsOpen] = useState(false)
  const [cabTypesOpen, setCabTypesOpen] = useState(false)

  // Update available engine models based on selected engine manufacturers
  const availableEngineModels = selectedEngineMfrs.flatMap((mfr) => {
    // Try to find the manufacturer in engine models with case-insensitive matching
    const matchingKey = Object.keys(engineModels).find(
      key => key.toLowerCase() === mfr.toLowerCase()
    );
    return matchingKey ? engineModels[matchingKey] : [];
  });

  // Add state variables for the new filters
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [statesOpen, setStatesOpen] = useState(false)

  // Get the display names for selected makes and models from dynamically loaded data
  const selectedMakeLabels = selectedMakes.map((make) => 
    truckMakes.find((m) => m.value === make)?.label || make
  )
  
  const selectedModelLabels = selectedModels.map((model) => {
    for (const make in truckModels) {
      const found = truckModels[make]?.find((m) => m.value === model)
      if (found) return found.label
    }
    return model
  })

  // Add state to store truck data 
  const [trucks, setTrucks] = useState<any[]>([])
  const [truckStats, setTruckStats] = useState<any>(null)

  // Add state for pagination in the parent component
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)

  // Add additional pagination state
  const [totalItems, setTotalItems] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Fetch filter options from database on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true)
        
        console.log("Fetching filter options from API...");
        
        // Fetch all filter options from the database
        const response = await fetch('/api/filter-options')
        const data = await response.json()
        
        // Log the complete response for debugging
        console.log("Filter options API response:", data);
        
        if (data.success) {
          // Log each set of options to verify what's being received
          console.log("Makes:", data.makes || []);
          console.log("Models:", data.models || {});
          console.log("Transmissions:", data.transmissions || []);
          console.log("Transmission Manufacturers:", data.transmissionManufacturers || []);
          console.log("Engine Manufacturers:", data.engineManufacturers || []);
          console.log("Engine Models:", data.engineModels || []);
          console.log("Cab Types:", data.cabTypes || []);
          
          // Set all dropdown options from the database
          setTruckMakes(data.makes.map((make: { label: string }) => ({ 
            value: make.label.toLowerCase(),
            label: make.label 
          })) || [])
          
          setTruckModels(data.models || {})
          
          // Map transmissions to transmissionTypes (fixing naming mismatch)
          setTransmissionTypes(data.transmissions || [])
          setTransmissionManufacturers(data.transmissionManufacturers || [])
          setEngineManufacturers(data.engineManufacturers || [])
          
          // For engineModels, we need to organize them by manufacturer if it's a flat array
          if (Array.isArray(data.engineModels)) {
            // Create a default category for models without a specific manufacturer
            const modelsByManufacturer: Record<string, Array<{ value: string; label: string }>> = {
              "all": data.engineModels
            };
            
            // If we have engine manufacturers, use the first one as default
            if (data.engineManufacturers && data.engineManufacturers.length > 0) {
              const defaultMfr = data.engineManufacturers[0].value;
              modelsByManufacturer[defaultMfr] = data.engineModels;
            }
            
            setEngineModels(modelsByManufacturer);
          } else {
            // It's already in the correct format
            setEngineModels(data.engineModels || {});
          }
          
          setCabTypes(data.cabTypes || [])
        } else {
          console.error("Failed to fetch filter options:", data.error)
        }
      } catch (error) {
        console.error("Error fetching filter options:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFilterOptions()
  }, [])
  
  // Update the handleSearch function to fix the type error
  const handleSearch = async () => {
    try {
      setSearchLoading(true)
      
      // Reset to first page when doing a new search
      setCurrentPage(1)
      
      // Use labels for makes and models but keep original values (codes) for states
      const selectedMakeLabels = selectedMakes.map(
        (make: string) => truckMakes.find(m => m.value === make)?.label || make
      )
      
      const newFilters: ExtendedTruckFilters = {
        makes: selectedMakeLabels, // Send labels instead of values
        models: selectedModels.map((model: string) => {
          for (const make in truckModels) {
            const found = truckModels[make]?.find(m => m.value === model)
            if (found) return found.label
          }
          return model
        }),
        miles: { value: miles, delta: milesDelta },
        year: { value: year, delta: yearDelta },
        horsepower: { value: horsepower, delta: horsepowerDelta },
        transmission: selectedTransmissions.map((trans: string) => 
          transmissionTypes.find(t => t.value === trans)?.label || trans
        ),
        transmissionManufacturer: selectedTransMfrs.map((mfr: string) => 
          transmissionManufacturers.find(m => m.value === mfr)?.label || mfr
        ),
        engineManufacturer: selectedEngineMfrs.map((mfr: string) => 
          engineManufacturers.find(m => m.value === mfr)?.label || mfr
        ),
        engineModel: selectedEngineModels.map((model: string) => {
          for (const mfr in engineModels) {
            const found = engineModels[mfr]?.find(m => m.value === model)
            if (found) return found.label
          }
          return model
        }),
        cab: selectedCabTypes.map((cab: string) => 
          cabTypes.find(c => c.value === cab)?.label || cab
        ),
        states: selectedStates, // Send the state codes directly, not the labels
      }
      
      // Log the filters being sent to the API
      console.log("Sending filters to API:", JSON.stringify(newFilters, null, 2));
      
      setFilters(newFilters)
      setSearchPerformed(true)
      setSearchCount((prev) => prev + 1)
      setRefreshTrigger((prev) => prev + 1)
      
      console.log("Fetching truck data from APIs simultaneously...");
      
      // Call all three APIs simultaneously using Promise.all
      const [countResponse, trucksResponse, statsResponse] = await Promise.all([
        fetch('/api/trucks/count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filters: newFilters }),
        }),
        fetch('/api/trucks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            filters: newFilters,
            page: currentPage,
            limit: pageSize
          }),
        }),
        fetch('/api/trucks/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filters: newFilters }),
        })
      ]);
      
      // Process count response
      const countData = await countResponse.json();
      console.log("Truck count API response:", countData);
      
      if (countData.count !== undefined) {
        console.log("Truck count:", countData.count);
        setTruckCount(countData.count);
      } else if (countData.error) {
        console.error("Failed to get truck count:", countData.error);
        setTruckCount(0);
      } else {
        console.error("Failed to get truck count: undefined");
        setTruckCount(0);
      }
      
      // Process trucks response
      const trucksData = await trucksResponse.json();
      console.log("Truck data API response:", trucksData);
      
      if (trucksData.success && trucksData.trucks) {
        // Object with trucks and pagination data
        setTrucks(trucksData.trucks);
        
        // Extract pagination data if available
        if (trucksData.pagination) {
          setTotalItems(trucksData.pagination.totalItems || 0);
          setTotalPages(trucksData.pagination.totalPages || 1);
          
          // Ensure currentPage is within valid range
          if (currentPage > trucksData.pagination.totalPages) {
            setCurrentPage(1);
          }
        }
      } else if (Array.isArray(trucksData)) {
        // Direct array of trucks (less common case)
        setTrucks(trucksData);
      } else if (trucksData.error) {
        console.error("Failed to get truck data:", trucksData.error);
        setTrucks([]);
      } else {
        console.error("Failed to get truck data: undefined");
        setTrucks([]);
      }
      
      // Process statistics response
      const statsData = await statsResponse.json();
      console.log("Truck statistics API response:", statsData);
      
      // Update stats state if available
      if (statsData && !statsData.error) {
        setTruckStats(statsData);
      } else {
        console.error("Failed to get truck statistics:", statsData?.error || "undefined");
        setTruckStats(null);
      }
      
    } catch (error) {
      console.error("Error getting truck data:", error);
      setTruckCount(0);
      setTrucks([]);
    } finally {
      setSearchLoading(false);
    }
  }

  // Update the handleVinSearch function
  const handleVinSearch = async () => {
    if (vin && vin.length >= 17) {
      try {
        setVinSearchLoading(true)
        setVinSearchPerformed(false); // Reset while searching
        
        console.log(`Searching for VIN: ${vin}`);
        
        // Call the server-side API endpoint
        const response = await fetch(`/api/vin?vin=${vin}`);
        const data = await response.json();
        
        // Log the full response for debugging
        console.log("VIN API Response:", data);
        
        if (data && data.id) {
          // If we have a truck object directly
          const truckData = data;
          console.log("VIN match found:", truckData);
          setVinMatchFound(true);
          
          // Parse the mileage string to a number by removing commas and 'mi' suffix
          let mileageValue = 0;
          if (truckData.mileage) {
            // Remove commas and non-numeric characters, then parse as integer
            mileageValue = parseInt(String(truckData.mileage).replace(/,/g, '').replace(/[^0-9]/g, ''));
          }
          
          // Map the MySQL data to the vinSpecs format with correct field names and fallbacks
          const specs = {
            make: truckData.manufacturer || "",
            model: truckData.model || "",
            year: truckData.year ? parseInt(String(truckData.year)) : 0, // Ensure year is a number
            miles: mileageValue, // Use the parsed mileage value
            trim: truckData.trim || "",
            engine: truckData.engine_model || "",
            transmission: truckData.transmission || "",
            exteriorColor: truckData.color || "",
            interiorColor: truckData.seats_upholstery || "",
            axleRatio: truckData.ratio || "",
            suspension: truckData.suspension || "",
            wheelbase: truckData.wheelbase || ""
          };
          
          console.log("Mapped specs:", specs);
          setVinSpecs(specs);
          
          // Only pre-fill the search criteria if values exist
          if (specs.make) setSelectedMakes([specs.make.toLowerCase()]);
          if (specs.model) setSelectedModels([specs.model.toLowerCase()]);
          if (specs.year) setYear(specs.year);
          if (specs.miles) setMiles(specs.miles);
        } else {
          console.log("No VIN match found");
          setVinMatchFound(false);
          setVinSpecs(null);
        }
      } catch (error) {
        console.error("Error searching VIN:", error);
        setVinMatchFound(false);
        setVinSpecs(null);
      } finally {
        setVinSearchLoading(false)
        setVinSearchPerformed(true);
      }
    } else {
      console.warn("Invalid VIN length:", vin.length);
    }
  }

  const applyVinSpecsToSearch = () => {
    if (vinSpecs) {
      setApplyVinSpecsLoading(true)
      // Apply the specs to the search and switch to criteria tab
      setActiveTab("criteria");
      // Then trigger search
      handleSearch().finally(() => {
        setApplyVinSpecsLoading(false)
      });
    }
  }

  const incrementValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, increment: number) => {
    setter(value + increment)
  }

  const decrementValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, decrement: number) => {
    setter(Math.max(0, value - decrement))
  }

  // Modify the setActiveTab function to reset relevant states when switching to VIN tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset search results when switching to VIN tab
    if (value === "vin") {
      setSearchPerformed(false);
    }
  }

  // Add a function to handle page changes that will trigger a new API call
  const handlePageChange = async (newPage: number) => {
    console.log(`Changing to page ${newPage}`);
    setCurrentPage(newPage);
    
    // Fetch new data for this page
    try {
      setSearchLoading(true);
      
      // Call the API with the current filters but new page number
      const response = await fetch('/api/trucks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filters,
          page: newPage,
          limit: pageSize
        }),
      });
      
      const trucksData = await response.json();
      console.log("Page change API response:", trucksData);
      
      if (trucksData.success && trucksData.trucks) {
        setTrucks(trucksData.trucks);
        
        // Update pagination data if available
        if (trucksData.pagination) {
          setTotalItems(trucksData.pagination.totalItems || 0);
          setTotalPages(trucksData.pagination.totalPages || 1);
        }
        
        // Force refresh of the TruckList component
        setRefreshTrigger(prev => prev + 1);
      } else if (trucksData.error) {
        console.error("Failed to get truck data:", trucksData.error);
      }
    } catch (error) {
      console.error("Error getting truck data for page change:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle page size changes that will trigger a new API call
  const handlePageSizeChange = async (newSize: number) => {
    console.log(`Changing page size to ${newSize}`);
    setPageSize(newSize);
    
    // Reset to page 1 when changing page size
    setCurrentPage(1);
    
    // Fetch new data with the new page size
    try {
      setSearchLoading(true);
      
      const response = await fetch('/api/trucks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filters,
          page: 1, // Reset to page 1
          limit: newSize
        }),
      });
      
      const trucksData = await response.json();
      
      if (trucksData.success && trucksData.trucks) {
        setTrucks(trucksData.trucks);
        
        // Update pagination data if available
        if (trucksData.pagination) {
          setTotalItems(trucksData.pagination.totalItems || 0);
          setTotalPages(trucksData.pagination.totalPages || 1);
        }
        
        // Force refresh of the TruckList component
        setRefreshTrigger(prev => prev + 1);
      } else if (trucksData.error) {
        console.error("Failed to get truck data:", trucksData.error);
      }
    } catch (error) {
      console.error("Error getting truck data for page size change:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Render loading state if options are still loading
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading filter options...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Find Similar Trucks</CardTitle>
          <CardDescription>Select your criteria to find comparable trucks and their prices</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="criteria">Search by Criteria</TabsTrigger>
              <TabsTrigger value="vin">Search by VIN</TabsTrigger>
            </TabsList>
            
            <TabsContent value="criteria">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Make Selection */}
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Popover open={makesOpen} onOpenChange={setMakesOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={makesOpen}
                        className="w-full justify-between"
                      >
                        {selectedMakes.length > 0 ? `${selectedMakes.length} selected` : "Select makes..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search makes..." />
                        <CommandList>
                          <CommandEmpty>No make found.</CommandEmpty>
                          <CommandGroup>
                            {truckMakes.map((make) => (
                              <CommandItem
                                key={make.value}
                                value={make.value}
                                onSelect={() => {
                                  setSelectedMakes(
                                    selectedMakes.includes(make.value)
                                      ? selectedMakes.filter((m) => m !== make.value)
                                      : [...selectedMakes, make.value],
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedMakes.includes(make.value) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {make.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedMakes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedMakes.map((make) => {
                        const makeLabel = truckMakes.find((m) => m.value === make)?.label
                        return (
                          <Badge key={make} variant="secondary" className="text-xs">
                            {makeLabel}
                            <button
                              className="ml-1 text-xs"
                              onClick={() => setSelectedMakes(selectedMakes.filter((m) => m !== make))}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Popover open={modelsOpen} onOpenChange={setModelsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={modelsOpen}
                        className="w-full justify-between"
                        disabled={availableModels.length === 0}
                      >
                        {selectedModels.length > 0 ? `${selectedModels.length} selected` : "Select models..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search models..." />
                        <CommandList>
                          <CommandEmpty>No model found.</CommandEmpty>
                          <CommandGroup>
                            {availableModels.map((model) => (
                              <CommandItem
                                key={model.value}
                                value={model.value}
                                onSelect={() => {
                                  setSelectedModels(
                                    selectedModels.includes(model.value)
                                      ? selectedModels.filter((m) => m !== model.value)
                                      : [...selectedModels, model.value],
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedModels.includes(model.value) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {model.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedModels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedModels.map((model) => {
                        const modelLabel = availableModels.find((m) => m.value === model)?.label
                        return (
                          <Badge key={model} variant="secondary" className="text-xs">
                            {modelLabel}
                            <button
                              className="ml-1 text-xs"
                              onClick={() => setSelectedModels(selectedModels.filter((m) => m !== model))}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Miles */}
                <div className="space-y-2">
                  <Label htmlFor="miles">Miles</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => decrementValue(setMiles, miles, 50000)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="miles"
                      type="number"
                      value={miles}
                      onChange={(e) => setMiles(Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <Button variant="outline" size="icon" onClick={() => incrementValue(setMiles, miles, 50000)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Range: ±</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => decrementValue(setMilesDelta, milesDelta, 50000)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-medium">{milesDelta.toLocaleString()}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => incrementValue(setMilesDelta, milesDelta, 50000)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => decrementValue(setYear, year, 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="year"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <Button variant="outline" size="icon" onClick={() => incrementValue(setYear, year, 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Range: ±</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => decrementValue(setYearDelta, yearDelta, 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-medium">{yearDelta} years</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => incrementValue(setYearDelta, yearDelta, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Horsepower */}
                <div className="space-y-2">
                  <Label htmlFor="horsepower">Horsepower</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => decrementValue(setHorsepower, horsepower, 25)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="horsepower"
                      type="number"
                      value={horsepower}
                      onChange={(e) => setHorsepower(Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <Button variant="outline" size="icon" onClick={() => incrementValue(setHorsepower, horsepower, 25)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Range: ±</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => decrementValue(setHorsepowerDelta, horsepowerDelta, 25)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-medium">{horsepowerDelta} HP</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => incrementValue(setHorsepowerDelta, horsepowerDelta, 25)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Transmission Type */}
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Popover open={transmissionsOpen} onOpenChange={setTransmissionsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={transmissionsOpen}
                        className="w-full justify-between"
                      >
                        {selectedTransmissions.length > 0 ? `${selectedTransmissions.length} selected` : "Select transmission..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search transmissions..." />
                        <CommandList>
                          <CommandEmpty>No transmission found.</CommandEmpty>
                          <CommandGroup>
                            {transmissionTypes.map((transmission) => (
                              <CommandItem
                                key={transmission.value}
                                value={transmission.value}
                                onSelect={() => {
                                  setSelectedTransmissions(
                                    selectedTransmissions.includes(transmission.value)
                                      ? selectedTransmissions.filter((t) => t !== transmission.value)
                                      : [...selectedTransmissions, transmission.value],
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedTransmissions.includes(transmission.value) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {transmission.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedTransmissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTransmissions.map((trans) => {
                        const transLabel = transmissionTypes.find((t) => t.value === trans)?.label
                        return (
                          <Badge key={trans} variant="secondary" className="text-xs">
                            {transLabel}
                            <button
                              className="ml-1 text-xs"
                              onClick={() => setSelectedTransmissions(selectedTransmissions.filter((t) => t !== trans))}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Transmission Manufacturer */}
                <div className="space-y-2">
                  <Label htmlFor="trans-mfr">Transmission Manufacturer</Label>
                  <Popover open={transMfrsOpen} onOpenChange={setTransMfrsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={transMfrsOpen}
                        className="w-full justify-between"
                      >
                        {selectedTransMfrs.length > 0 ? `${selectedTransMfrs.length} selected` : "Select manufacturer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search manufacturers..." />
                        <CommandList>
                          <CommandEmpty>No manufacturer found.</CommandEmpty>
                          <CommandGroup>
                            {transmissionManufacturers.map((mfr) => (
                              <CommandItem
                                key={mfr.value}
                                value={mfr.value}
                                onSelect={() => {
                                  setSelectedTransMfrs(
                                    selectedTransMfrs.includes(mfr.value)
                                      ? selectedTransMfrs.filter((m) => m !== mfr.value)
                                      : [...selectedTransMfrs, mfr.value],
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedTransMfrs.includes(mfr.value) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {mfr.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedTransMfrs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTransMfrs.map((mfr) => {
                        const mfrLabel = transmissionManufacturers.find((m) => m.value === mfr)?.label
                        return (
                          <Badge key={mfr} variant="secondary" className="text-xs">
                            {mfrLabel}
                            <button
                              className="ml-1 text-xs"
                              onClick={() => setSelectedTransMfrs(selectedTransMfrs.filter((m) => m !== mfr))}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Engine Manufacturer */}
                <div className="space-y-2">
                  <Label htmlFor="engine-mfr">Engine Manufacturer</Label>
                  <Popover open={engineMfrsOpen} onOpenChange={setEngineMfrsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={engineMfrsOpen}
                        className="w-full justify-between"
                      >
                        {selectedEngineMfrs.length > 0 ? `${selectedEngineMfrs.length} selected` : "Select manufacturer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search manufacturers..." />
                        <CommandList>
                          <CommandEmpty>No manufacturer found.</CommandEmpty>
                          <CommandGroup>
                            {engineManufacturers.map((mfr) => (
                              <CommandItem
                                key={mfr.value}
                                value={mfr.value}
                                onSelect={() => {
                                  setSelectedEngineMfrs(
                                    selectedEngineMfrs.includes(mfr.value)
                                      ? selectedEngineMfrs.filter((m) => m !== mfr.value)
                                      : [...selectedEngineMfrs, mfr.value],
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedEngineMfrs.includes(mfr.value) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {mfr.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedEngineMfrs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedEngineMfrs.map((mfr) => {
                        const mfrLabel = engineManufacturers.find((m) => m.value === mfr)?.label
                        return (
                          <Badge key={mfr} variant="secondary" className="text-xs">
                            {mfrLabel}
                            <button
                              className="ml-1 text-xs"
                              onClick={() => setSelectedEngineMfrs(selectedEngineMfrs.filter((m) => m !== mfr))}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Engine Model */}
                <div className="space-y-2">
                  <Label htmlFor="engine-model">Engine Model</Label>
                  <Popover open={engineModelsOpen} onOpenChange={setEngineModelsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={engineModelsOpen}
                        className="w-full justify-between"
                        disabled={availableEngineModels.length === 0}
                      >
                        {selectedEngineModels.length > 0 ? `${selectedEngineModels.length} selected` : "Select model..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search models..." />
                        <CommandList>
                          <CommandEmpty>No model found.</CommandEmpty>
                          <CommandGroup>
                            {availableEngineModels.map((model) => (
                              <CommandItem
                                key={model.value}
                                value={model.value}
                                onSelect={() => {
                                  setSelectedEngineModels(
                                    selectedEngineModels.includes(model.value)
                                      ? selectedEngineModels.filter((m) => m !== model.value)
                                      : [...selectedEngineModels, model.value],
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedEngineModels.includes(model.value) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {model.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedEngineModels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedEngineModels.map((model) => {
                        const modelLabel = availableEngineModels.find((m) => m.value === model)?.label
                        return (
                          <Badge key={model} variant="secondary" className="text-xs">
                            {modelLabel}
                            <button
                              className="ml-1 text-xs"
                              onClick={() => setSelectedEngineModels(selectedEngineModels.filter((m) => m !== model))}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Cab Type */}
                <div className="space-y-2">
                  <Label htmlFor="cab-type">Cab Type</Label>
                  <Popover open={cabTypesOpen} onOpenChange={setCabTypesOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={cabTypesOpen}
                        className="w-full justify-between"
                      >
                        {selectedCabTypes.length > 0 ? `${selectedCabTypes.length} selected` : "Select cab type..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search cab types..." />
                        <CommandList>
                          <CommandEmpty>No cab type found.</CommandEmpty>
                          <CommandGroup>
                            {cabTypes.map((cab) => (
                              <CommandItem
                                key={cab.value}
                                value={cab.value}
                                onSelect={() => {
                                  setSelectedCabTypes(
                                    selectedCabTypes.includes(cab.value)
                                      ? selectedCabTypes.filter((c) => c !== cab.value)
                                      : [...selectedCabTypes, cab.value],
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCabTypes.includes(cab.value) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {cab.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCabTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedCabTypes.map((cab) => {
                        const cabLabel = cabTypes.find((c) => c.value === cab)?.label
                        return (
                          <Badge key={cab} variant="secondary" className="text-xs">
                            {cabLabel}
                            <button
                              className="ml-1 text-xs"
                              onClick={() => setSelectedCabTypes(selectedCabTypes.filter((c) => c !== cab))}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* State */}
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Popover open={statesOpen} onOpenChange={setStatesOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statesOpen}
                        className="w-full justify-between"
                      >
                        {selectedStates.length > 0 ? `${selectedStates.length} selected` : "Select states..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search states..." />
                        <CommandList>
                          <CommandEmpty>No state found.</CommandEmpty>
                          <CommandGroup>
                            {states.map((state) => (
                              <CommandItem
                                key={state.value}
                                value={state.value}
                                onSelect={() => {
                                  setSelectedStates(
                                    selectedStates.includes(state.value)
                                      ? selectedStates.filter((s) => s !== state.value)
                                      : [...selectedStates, state.value],
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedStates.includes(state.value) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {state.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedStates.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedStates.map((stateValue) => {
                        const stateLabel = states.find((s) => s.value === stateValue)?.label
                        return (
                          <Badge key={stateValue} variant="secondary" className="text-xs">
                            {stateLabel}
                            <button
                              className="ml-1 text-xs"
                              onClick={() => setSelectedStates(selectedStates.filter((s) => s !== stateValue))}
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Button disabled={searchLoading} className="w-full mt-6" onClick={handleSearch}>
                {searchLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Find Similar Trucks"
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="vin">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vin-input">Enter Vehicle Identification Number (VIN)</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="vin-input" 
                      value={vin} 
                      onChange={(e) => setVin(e.target.value.toUpperCase())}
                      placeholder="e.g., 1FTFW1ET5DFC54005"
                      maxLength={17}
                      className="flex-1"
                    />
                    <Button disabled={vinSearchLoading} onClick={handleVinSearch}>
                      {vinSearchLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      {vinSearchLoading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Enter a valid 17-character VIN to find exact match and populate search criteria</p>
                </div>
                
                {vinSearchPerformed && (
                  <div className="p-4 rounded-lg border">
                    {vinMatchFound ? (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <h3 className="font-medium">Match Found on TruckPaper</h3>
                        </div>
                        
                        {vinSpecs && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-sm font-medium">Make</p>
                                <p className="text-sm">{truckMakes.find(m => m.value === vinSpecs.make)?.label || vinSpecs.make || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Model</p>
                                <p className="text-sm">
                                  {truckModels[vinSpecs.make]?.find(m => m.value === vinSpecs.model)?.label || vinSpecs.model || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Year</p>
                                <p className="text-sm">{vinSpecs.year || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Miles</p>
                                <p className="text-sm">
                                  {vinSpecs.miles ? vinSpecs.miles.toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Engine</p>
                                <p className="text-sm">{vinSpecs.engine || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Transmission</p>
                                <p className="text-sm">{vinSpecs.transmission || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <Button 
                              disabled={applyVinSpecsLoading} 
                              className="w-full mt-4" 
                              onClick={applyVinSpecsToSearch}
                            >
                              {applyVinSpecsLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Searching...
                                </>
                              ) : (
                                "Use These Specs to Find Similar Trucks"
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                          <span className="text-yellow-600 text-xs">!</span>
                        </div>
                        <div>
                          <h3 className="font-medium">No Exact Match Found</h3>
                          <p className="text-sm text-muted-foreground">Try a different VIN or use the criteria search tab instead.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Only show results when searchPerformed is true AND we're on the criteria tab */}
      {searchPerformed && activeTab === "criteria" && (
        <>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Search Results</h2>
              {searchCount > 1 && (
                <Badge variant="outline" className="animate-pulse bg-green-50">
                  Updated
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              <span className="font-bold text-foreground">{truckCount}</span> similar trucks found
            </p>
            <div className="text-sm text-muted-foreground mt-1">
              {filters.makes.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span>Makes:</span>
                  {selectedMakeLabels.map((make) => (
                    <Badge key={make} variant="secondary" className="text-xs">
                      {make}
                    </Badge>
                  ))}
                </div>
              )}
              {filters.models.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center mt-1">
                  <span>Models:</span>
                  {selectedModelLabels.map((model) => (
                    <Badge key={model} variant="secondary" className="text-xs">
                      {model}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mt-1">
                <span>
                  Year: {filters.year.value - filters.year.delta} - {filters.year.value + filters.year.delta}
                </span>
                {" • "}
                <span>
                  Miles: {(filters.miles.value - filters.miles.delta).toLocaleString()} -{" "}
                  {(filters.miles.value + filters.miles.delta).toLocaleString()}
                </span>
              </div>
              
              {/* Display additional filters when they are used */}
              {filters.horsepower && (
                <div className="mt-1">
                  <span>
                    Horsepower: {filters.horsepower.value - filters.horsepower.delta} - {filters.horsepower.value + filters.horsepower.delta} HP
                  </span>
                </div>
              )}
              
              {filters.transmission && filters.transmission.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center mt-1">
                  <span>Transmission:</span>
                  {filters.transmission.map((t: string) => {
                    const label = transmissionTypes.find((type) => type.value === t)?.label;
                    return (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {filters.states && filters.states.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center mt-1">
                  <span>States:</span>
                  {filters.states.map((stateCode: string) => {
                    const stateInfo = states.find((s) => s.value === stateCode);
                    return (
                      <Badge key={stateCode} variant="secondary" className="text-xs">
                        {stateInfo?.value || stateCode}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pass trucks to the TruckSummaryStats component */}
          <TruckSummaryStats 
            trucks={trucks} 
            stats={truckStats}
            refreshTrigger={refreshTrigger} 
          />

          <Card>
            <CardHeader>
              <CardTitle>Similar Trucks</CardTitle>
            </CardHeader>
            <CardContent>
              <TruckList 
                trucks={trucks} 
                filters={filters} 
                key={`trucks-${refreshTrigger}`}
                disableExternalFetching={true}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                totalItems={totalItems}
                totalPages={totalPages}
                loading={searchLoading}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

