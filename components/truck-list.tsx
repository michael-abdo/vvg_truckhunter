"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

// Updated mock data for semi truck makes and models
const truckMakeModels = {
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
const generateRandomTruck = (id, filters) => {
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
    truckPaperUrl: truckPaperUrls[Math.floor(Math.random() * truckPaperUrls.length)]
  }
}

export default function TruckList({ refreshTrigger = 0, filters = {} }) {
  const [trucks, setTrucks] = useState([])

  // Effect to refresh trucks when refreshTrigger changes
  useEffect(() => {
    // Generate some new random trucks based on filters
    const newTrucks = Array(5)
      .fill(null)
      .map((_, index) => generateRandomTruck(index + 1, filters))

    setTrucks(newTrucks)

    // Add a visual indication that the data has changed
    setTimeout(() => {
      const rows = document.querySelectorAll("tbody tr")
      rows.forEach((row) => {
        row.classList.add("bg-green-50")
        setTimeout(() => {
          row.classList.remove("bg-green-50")
        }, 1000)
      })
    }, 100)
  }, [refreshTrigger, filters])

  return (
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
          {trucks.map((truck) => (
            <TableRow key={truck.id} className="transition-colors duration-300">
              <TableCell className="font-medium">
                <div>
                  {truck.make} {truck.model}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {truck.condition}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{truck.year}</TableCell>
              <TableCell>{truck.miles.toLocaleString()}</TableCell>
              <TableCell>${truck.price.toLocaleString()}</TableCell>
              <TableCell>{truck.location}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                >
                  <a 
                    href={truck.truckPaperUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

