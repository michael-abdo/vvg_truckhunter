import TruckFinder from "@/components/truck-finder"
import Image from "next/image"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Image 
          src="vvg-logo.jpg" 
          alt="Truck Finder Logo" 
          width={100} 
          height={100}
          className="mr-3"
        />
        <h1 className="text-3xl font-bold">Truck Finder</h1>
      </div>

      <TruckFinder />
    </main>
  )
}

