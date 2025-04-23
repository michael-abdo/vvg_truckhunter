import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

interface FilterOptions {
  makes: Array<{ value: string; label: string }>;
  states: Array<{ value: string; label: string }>;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  success?: boolean;
}

let optionsCache: FilterOptions | null = null;
let lastCacheUpdate: number = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function getFilterOptions(): Promise<FilterOptions> {
  const now = Date.now();
  
  // Return cached options if available and not expired
  if (optionsCache && (now - lastCacheUpdate < CACHE_TTL)) {
    console.log('Returning cached filter options');
    return optionsCache;
  }
  
  console.log('Fetching fresh filter options from database');
  
  // Fetch all distinct filter option values from the database
  try {
    const scanCommand = new ScanCommand({
      TableName: process.env.TRUCK_TABLE_NAME,
      ProjectionExpression: "#manufacturer, #st, #price, #year, #mileage",
      ExpressionAttributeNames: {
        "#manufacturer": "manufacturer",
        "#st": "state", // Using #st instead of #state as an alias
        "#price": "price",
        "#year": "year",
        "#mileage": "mileage"
      }
    });
    
    console.log('Sending scan command to DynamoDB:', JSON.stringify(scanCommand, null, 2));
    
    const result = await docClient.send(scanCommand);
    const items = result.Items || [];
    
    console.log(`Retrieved ${items.length} items for filter options`);
    
    // Extract unique values for each option type
    const makes = new Set<string>();
    const states = new Set<string>();
    let minYear: number | undefined;
    let maxYear: number | undefined;
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    let minMileage: number | undefined;
    let maxMileage: number | undefined;
    
    items.forEach(item => {
      // Collect makes (now from manufacturer field)
      if (item.manufacturer) makes.add(item.manufacturer);
      
      // Collect states
      if (item.state) states.add(item.state);
      
      // Track min/max year
      if (item.year) {
        const year = Number(item.year);
        if (!isNaN(year)) {
          minYear = minYear === undefined ? year : Math.min(minYear, year);
          maxYear = maxYear === undefined ? year : Math.max(maxYear, year);
        }
      }
      
      // Track min/max price
      if (item.price) {
        const price = Number(item.price);
        if (!isNaN(price)) {
          minPrice = minPrice === undefined ? price : Math.min(minPrice, price);
          maxPrice = maxPrice === undefined ? price : Math.max(maxPrice, price);
        }
      }
      
      // Track min/max mileage
      if (item.mileage) {
        const mileage = Number(item.mileage);
        if (!isNaN(mileage)) {
          minMileage = minMileage === undefined ? mileage : Math.min(minMileage, mileage);
          maxMileage = maxMileage === undefined ? mileage : Math.max(maxMileage, mileage);
        }
      }
    });
    
    // Convert sets to arrays of objects with value and label properties
    const formattedMakes = Array.from(makes).map(make => ({
      value: make.toLowerCase(),
      label: make
    })).sort((a, b) => a.label.localeCompare(b.label));
    
    const formattedStates = Array.from(states).map(state => ({
      value: state,
      label: state
    })).sort((a, b) => a.label.localeCompare(b.label));
    
    // Update cache
    optionsCache = {
      makes: formattedMakes,
      states: formattedStates,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      minMileage,
      maxMileage,
      success: true
    };
    
    console.log('Created filter options cache:', optionsCache);
    
    lastCacheUpdate = now;
    return optionsCache;
  } catch (error: unknown) {
    console.error("Failed to fetch filter options:", error);
    // Check if error is an Error object before accessing .message
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error fetching filter options: ${errorMessage}`);
  }
}

// Function to manually refresh the cache
export function refreshOptionsCache(): void {
  optionsCache = null;
  lastCacheUpdate = 0;
} 