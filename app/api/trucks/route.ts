import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand, ScanCommandOutput } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('searchTerm') || '';
    const minYear = searchParams.get('minYear') || '';
    const maxYear = searchParams.get('maxYear') || '';
    const minMileage = searchParams.get('minMileage') || '';
    const maxMileage = searchParams.get('maxMileage') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const makes = searchParams.get('makes') || '';
    const states = searchParams.get('states') || '';
    
    console.log('Filter params received:', { 
      searchTerm, minYear, maxYear, minMileage, maxMileage, 
      minPrice, maxPrice, makes, states 
    });
    
    // Parse the makes and states arrays
    const selectedMakes = makes ? JSON.parse(makes) : [];
    const selectedStates = states ? JSON.parse(states) : [];
    
    console.log('Parsed states:', selectedStates);
    
    // Build filter expression for DynamoDB
    const filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};
    
    // Search term filter (search in manufacturer, model, and description)
    if (searchTerm) {
      filterExpressions.push("(contains(#manufacturer, :searchTerm) OR contains(#model, :searchTerm) OR contains(#description, :searchTerm))");
      expressionAttributeValues[':searchTerm'] = searchTerm;
      expressionAttributeNames['#manufacturer'] = 'manufacturer';
      expressionAttributeNames['#model'] = 'model';
      expressionAttributeNames['#description'] = 'description';
    }
    
    // Year range filter
    if (minYear) {
      filterExpressions.push("#year_clean >= :minYear");
      expressionAttributeValues[':minYear'] = Number(minYear);
      expressionAttributeNames['#year'] = 'year_clean';
    }
    
    if (maxYear) {
      filterExpressions.push("#year_clean <= :maxYear");
      expressionAttributeValues[':maxYear'] = Number(maxYear);
      expressionAttributeNames['#year'] = 'year_clean';
    }
    
    // Mileage range filter
    if (minMileage) {
      filterExpressions.push("#mileage_clean >= :minMileage");
      expressionAttributeValues[':minMileage'] = Number(minMileage);
      expressionAttributeNames['#mileage'] = 'mileage_clean';
    }
    
    if (maxMileage) {
      filterExpressions.push("#mileage_clean <= :maxMileage");
      expressionAttributeValues[':maxMileage'] = Number(maxMileage);
      expressionAttributeNames['#mileage'] = 'mileage_clean';
    }
    
    // Price range filter
    if (minPrice) {
      filterExpressions.push("#price >= :minPrice");
      expressionAttributeValues[':minPrice'] = Number(minPrice);
      expressionAttributeNames['#price'] = 'price';
    }
    
    if (maxPrice) {
      filterExpressions.push("#price <= :maxPrice");
      expressionAttributeValues[':maxPrice'] = Number(maxPrice);
      expressionAttributeNames['#price'] = 'price';
    }
    
    // Makes filter
    if (selectedMakes.length > 0) {
      const makeExpressions = selectedMakes.map((make: string, index: number) => {
        const makeKey = `:make${index}`;
        expressionAttributeValues[makeKey] = make;
        return `#manufacturer = ${makeKey}`;
      });
      expressionAttributeNames['#manufacturer'] = 'manufacturer';
      filterExpressions.push(`(${makeExpressions.join(' OR ')})`);
    }
    
    // State filter
    if (selectedStates.length > 0) {
      console.log('Adding state filter for:', selectedStates);
      const stateExpressions = selectedStates.map((state: string, index: number) => {
        const stateKey = `:state${index}`;
        expressionAttributeValues[stateKey] = state;
        return `#state = ${stateKey}`;
      });
      expressionAttributeNames['#state'] = 'state';
      filterExpressions.push(`(${stateExpressions.join(' OR ')})`);
      
      console.log('State filter expressions:', stateExpressions);
    }
    
    console.log('All filter expressions:', filterExpressions);
    console.log('Expression attribute values:', expressionAttributeValues);
    console.log('Expression attribute names:', expressionAttributeNames);
    
    // Query DynamoDB directly for trucks matching the filters
    const scanCommand = new ScanCommand({
      TableName: process.env.TRUCK_TABLE_NAME,
      FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined
    });
    
    const result = await docClient.send(scanCommand);
    const trucks = result.Items || [];
    
    console.log(`Retrieved ${trucks.length} trucks after filtering`);
    if (trucks.length > 0) {
      console.log('First truck sample:', trucks[0]);
    }
    
    return NextResponse.json(trucks);
  } catch (error) {
    console.error('Error filtering trucks:', error);
    return NextResponse.json({ error: 'Failed to filter trucks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { filters } = data;
    
    console.log('POST request received with filters:', JSON.stringify(filters, null, 2));
    
    // Check if environment variable is set
    if (!process.env.TRUCK_TABLE_NAME) {
      console.error('TRUCK_TABLE_NAME environment variable is not set');
      return NextResponse.json({ success: false, error: 'Table name not configured' }, { status: 500 });
    }
    
    console.log('Using DynamoDB table:', process.env.TRUCK_TABLE_NAME);
    
    // Build filter expression for DynamoDB
    const filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};
    
    // Makes filter
    if (filters.makes && filters.makes.length > 0) {
      const makeExpressions = filters.makes.map((make: string, index: number) => {
        const makeKey = `:make${index}`;
        expressionAttributeValues[makeKey] = make;
        return `#manufacturer = ${makeKey}`;
      });
      expressionAttributeNames['#manufacturer'] = 'manufacturer';
      filterExpressions.push(`(${makeExpressions.join(' OR ')})`);
      console.log('Added make filter:', makeExpressions);
    }
    
    // States filter - Check the exact format and values being passed
    if (filters.states && filters.states.length > 0) {
      console.log('States before filtering:', filters.states);
      // Attempt to print an example of each state to see format
      filters.states.forEach((state: string, index: number) => {
        console.log(`State ${index}: "${state}" (type: ${typeof state})`);
      });
      
      const stateExpressions = filters.states.map((state: string, index: number) => {
        const stateKey = `:state${index}`;
        expressionAttributeValues[stateKey] = state;
        return `#state = ${stateKey}`;
      });
      expressionAttributeNames['#state'] = 'state';
      filterExpressions.push(`(${stateExpressions.join(' OR ')})`);
      console.log('Added state filter expressions:', stateExpressions);
    }
    
    // Models filter
    if (filters.models && filters.models.length > 0) {
      const modelExpressions = filters.models.map((model: string, index: number) => {
        const modelKey = `:model${index}`;
        expressionAttributeValues[modelKey] = model;
        return `#model = ${modelKey}`;
      });
      expressionAttributeNames['#model'] = 'model';
      filterExpressions.push(`(${modelExpressions.join(' OR ')})`);
    }
    
    // Miles range filter
    if (filters.miles) {
      const { value, delta } = filters.miles;
      filterExpressions.push("#mileage BETWEEN :minMileage AND :maxMileage");
      expressionAttributeValues[':minMileage'] = Number(value - delta);
      expressionAttributeValues[':maxMileage'] = Number(value + delta);
      expressionAttributeNames['#mileage'] = 'mileage_clean';
    }
    
    // Year range filter
    if (filters.year) {
      const { value, delta } = filters.year;
      filterExpressions.push("#year BETWEEN :minYear AND :maxYear");
      expressionAttributeValues[':minYear'] = Number(value - delta);
      expressionAttributeValues[':maxYear'] = Number(value + delta);
      expressionAttributeNames['#year'] = 'year_clean';
    }
    
    // Horsepower range filter
    if (filters.horsepower) {
      const { value, delta } = filters.horsepower;
      filterExpressions.push("#horsepower BETWEEN :minHorsepower AND :maxHorsepower");
      expressionAttributeValues[':minHorsepower'] = Number(value - delta);
      expressionAttributeValues[':maxHorsepower'] = Number(value + delta);
      expressionAttributeNames['#horsepower'] = 'horsepower_clean';
    }
    
    // Add other filters (transmission, engine, cab, etc.) as needed
    // ... 
    
    console.log('Filter expressions:', filterExpressions);
    console.log('Expression attribute values:', expressionAttributeValues);
    console.log('Expression attribute names:', expressionAttributeNames);
    
    // Log the complete DynamoDB query parameters
    console.log('Complete DynamoDB query parameters:');
    console.log('TableName:', process.env.TRUCK_TABLE_NAME);
    console.log('FilterExpression:', filterExpressions.length > 0 ? filterExpressions.join(' AND ') : 'none');
    console.log('ExpressionAttributeValues:', JSON.stringify(expressionAttributeValues, null, 2));
    console.log('ExpressionAttributeNames:', JSON.stringify(expressionAttributeNames, null, 2));
    
    async function getAllItems() {
      let allItems: any[] = [];
      let lastEvaluatedKey: Record<string, any> | undefined = undefined;
      
      do {
        const scanCommand = new ScanCommand({
          TableName: process.env.TRUCK_TABLE_NAME,
          FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
          ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
          ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
          ExclusiveStartKey: lastEvaluatedKey
        });
        
        const result = await docClient.send(scanCommand) as ScanCommandOutput;
        if (result.Items && result.Items.length > 0) {
          allItems = [...allItems, ...result.Items];
        }
        
        lastEvaluatedKey = result.LastEvaluatedKey;
        
        console.log(`Retrieved batch of ${result.Items?.length || 0} trucks, total so far: ${allItems.length}`);
      } while (lastEvaluatedKey);
      
      console.log(`Retrieved total of ${allItems.length} trucks after complete scan`);
      return allItems;
    }
    
    const trucks = await getAllItems();
    return NextResponse.json({ success: true, trucks });
  } catch (error) {
    console.error('Error processing POST request:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch trucks',
      errorDetails: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 