"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleDollarSign, Clock, Gauge, Calendar, BarChart2 } from "lucide-react"

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change?: string
  loading: boolean
}

const StatItem = ({ icon, label, value, change, loading }: StatItemProps) => (
  <div className="flex items-start space-x-4">
    <div className="p-2 bg-muted rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {loading ? (
        <div className="h-6 w-24 bg-muted animate-pulse rounded mt-1"></div>
      ) : (
        <div className="flex items-baseline">
          <h3 className="text-2xl font-bold">{value}</h3>
          {change && <p className="ml-2 text-xs text-green-500">{change}</p>}
        </div>
      )}
    </div>
  </div>
)

interface TruckSummaryStatsProps {
  trucks: any[] // Array of truck objects from the API
  refreshTrigger?: number // Optional now that we're not making API calls
}

export default function TruckSummaryStats({ trucks = [] }: TruckSummaryStatsProps) {
  const [stats, setStats] = useState({
    averagePrice: 0,
    averageYear: 0,
    averageMileage: 0,
    averageHorsepower: 0,
    priceRange: { min: 0, max: 0 },
  })
  const [loading, setLoading] = useState(true)

  // Calculate statistics whenever trucks data changes
  useEffect(() => {
    // Don't calculate if no trucks data
    if (!trucks || trucks.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Extract relevant fields from each truck
      const prices = trucks.map(truck => truck.price_clean).filter(price => price !== undefined && price !== null)
      const years = trucks.map(truck => truck.year_clean).filter(year => year !== undefined && year !== null)
      const mileages = trucks.map(truck => truck.mileage_clean).filter(mileage => mileage !== undefined && mileage !== null)
      const horsepowers = trucks.map(truck => truck.horsepower_clean).filter(hp => hp !== undefined && hp !== null)
      
      // Calculate averages
      const calculateAverage = (array: number[]) => 
        array.length ? array.reduce((sum, val) => sum + val, 0) / array.length : 0
      
      const minPrice = prices.length ? Math.min(...prices) : 0
      const maxPrice = prices.length ? Math.max(...prices) : 0
      
      // Set the statistics
      setStats({
        averagePrice: calculateAverage(prices),
        averageYear: calculateAverage(years),
        averageMileage: calculateAverage(mileages),
        averageHorsepower: calculateAverage(horsepowers),
        priceRange: { min: minPrice, max: maxPrice }
      })
    } catch (error) {
      console.error("Error calculating truck statistics:", error)
    } finally {
      setLoading(false)
    }
  }, [trucks])

  // Format the price with a dollar sign and commas
  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`
  }
  
  // Format the mileage with commas
  const formatMileage = (miles: number) => {
    return `${miles.toLocaleString()} mi`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatItem
            icon={<CircleDollarSign className="h-5 w-5 text-primary" />}
            label="Average Price"
            value={formatPrice(stats.averagePrice)}
            loading={loading}
          />
          <StatItem
            icon={<Calendar className="h-5 w-5 text-primary" />}
            label="Average Year"
            value={stats.averageYear.toFixed(1)}
            loading={loading}
          />
          <StatItem
            icon={<Gauge className="h-5 w-5 text-primary" />}
            label="Average Mileage"
            value={formatMileage(stats.averageMileage)}
            loading={loading}
          />
          <StatItem
            icon={<BarChart2 className="h-5 w-5 text-primary" />}
            label="Average Horsepower"
            value={`${stats.averageHorsepower.toFixed(0)} HP`}
            loading={loading}
          />
        </div>
        
        {!loading && trucks.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Price Range: <span className="font-medium">{formatPrice(stats.priceRange.min)}</span> to <span className="font-medium">{formatPrice(stats.priceRange.max)}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {trucks.length} trucks matching your criteria
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 