"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Minus, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import TruckList from "./truck-list"
import PriceChart from "./price-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for makes and models of semi trucks
const truckMakes = [
  { value: "freightliner", label: "Freightliner" },
  { value: "peterbilt", label: "Peterbilt" },
  { value: "kenworth", label: "Kenworth" },
  { value: "volvo", label: "Volvo" },
  { value: "international", label: "International" },
  { value: "mack", label: "Mack" },
  { value: "western-star", label: "Western Star" },
]

const truckModels = {
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

export default function TruckFinder() {
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

  // Filter criteria state
  const [filters, setFilters] = useState({
    makes: [],
    models: [],
    miles: { value: 300000, delta: 100000 },
    year: { value: 2018, delta: 3 },
  })

  // Available models based on selected makes
  const availableModels = selectedMakes.flatMap((make) => truckModels[make] || [])

  const handleSearch = () => {
    // Update filters with current values
    setFilters({
      makes: selectedMakes,
      models: selectedModels,
      miles: { value: miles, delta: milesDelta },
      year: { value: year, delta: yearDelta },
    })

    setSearchPerformed(true)
    setSearchCount((prev) => prev + 1)
    setRefreshTrigger((prev) => prev + 1)

    // Calculate a somewhat realistic truck count based on filter breadth
    const makeMultiplier = selectedMakes.length > 0 ? selectedMakes.length : 6
    const modelMultiplier = selectedModels.length > 0 ? selectedModels.length : 4
    const yearRange = yearDelta * 2
    const milesRangeFactor = milesDelta / 100000

    const baseCount = 5 + Math.floor(Math.random() * 10)
    const calculatedCount = Math.floor(
      (baseCount * makeMultiplier * modelMultiplier * yearRange * milesRangeFactor) / 10,
    )

    setTruckCount(Math.max(calculatedCount, 1))
  }

  const handleVinSearch = () => {
    // Simulate API call to search for VIN
    if (vin && vin.length >= 17) {
      const found = Math.random() > 0.3;
      setVinMatchFound(found);
      
      if (found) {
        // Randomly select a make
        const randomMake = truckMakes[Math.floor(Math.random() * truckMakes.length)].value;
        
        // Select a model that actually belongs to that make
        const availableModels = truckModels[randomMake] || [];
        const randomModel = availableModels.length > 0 
          ? availableModels[Math.floor(Math.random() * availableModels.length)].value
          : "unknown";
        
        // Create the mock specs with the correct make/model
        const mockSpecs = {
          make: randomMake,
          model: randomModel,
          year: 2017 + Math.floor(Math.random() * 5),
          miles: 250000 + Math.floor(Math.random() * 500000),
          trim: "AeroCab Sleeper",
          engine: "Cummins X15 15L",
          transmission: "Eaton Fuller 13-speed",
          drivetrain: "6x4",
          exteriorColor: "White",
          interiorColor: "Gray",
          sleeper: "76-inch High-Roof",
          axleRatio: "3.42",
          suspension: "Air Ride",
          wheelbase: "240 inches"
        };
        
        setVinSpecs(mockSpecs);
        
        // Pre-fill the search criteria
        setSelectedMakes([mockSpecs.make]);
        setSelectedModels([mockSpecs.model]);
        setYear(mockSpecs.year);
        setMiles(mockSpecs.miles);
      } else {
        setVinSpecs(null);
      }
      
      setVinSearchPerformed(true);
    }
  }

  const applyVinSpecsToSearch = () => {
    if (vinSpecs) {
      // Apply the specs to the search and switch to criteria tab
      setActiveTab("criteria");
      // Then trigger search
      handleSearch();
    }
  }

  const incrementValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, increment: number) => {
    setter(value + increment)
  }

  const decrementValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, decrement: number) => {
    setter(Math.max(0, value - decrement))
  }

  // Get the display names for selected makes and models
  const selectedMakeLabels = selectedMakes.map((make) => truckMakes.find((m) => m.value === make)?.label || make)

  const selectedModelLabels = selectedModels.map((model) => {
    for (const make in truckModels) {
      const found = truckModels[make].find((m) => m.value === model)
      if (found) return found.label
    }
    return model
  })

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Find Similar Trucks</CardTitle>
          <CardDescription>Select your criteria to find comparable trucks and their prices</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              </div>
              <Button className="w-full mt-6" onClick={handleSearch}>
                Find Similar Trucks
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
                    <Button onClick={handleVinSearch}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
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
                                <p className="text-sm">{truckMakes.find(m => m.value === vinSpecs.make)?.label || vinSpecs.make}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Model</p>
                                <p className="text-sm">
                                  {truckModels[vinSpecs.make]?.find(m => m.value === vinSpecs.model)?.label || vinSpecs.model}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Year</p>
                                <p className="text-sm">{vinSpecs.year}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Miles</p>
                                <p className="text-sm">{vinSpecs.miles.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Engine</p>
                                <p className="text-sm">{vinSpecs.engine}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Transmission</p>
                                <p className="text-sm">{vinSpecs.transmission}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Sleeper</p>
                                <p className="text-sm">{vinSpecs.sleeper}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Drivetrain</p>
                                <p className="text-sm">{vinSpecs.drivetrain}</p>
                              </div>
                            </div>
                            
                            <Button className="w-full mt-4" onClick={applyVinSpecsToSearch}>
                              Use These Specs to Find Similar Trucks
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

      {searchPerformed && (
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
              <span className="font-bold text-foreground">{truckCount}</span> similar trucks found over the last 6
              months
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
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Price Trends (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceChart key={refreshTrigger} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Similar Trucks</CardTitle>
              </CardHeader>
              <CardContent>
                <TruckList refreshTrigger={refreshTrigger} filters={filters} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

