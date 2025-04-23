import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, ScanCommandOutput } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(request: Request) {
  console.log("Received request to /api/trucks/count");
  
  try {
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const filters = body.filters || {};
    console.log("Extracted filters:", JSON.stringify(filters, null, 2));
    
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
    
    // States filter
    if (filters.states && filters.states.length > 0) {
      const stateExpressions = filters.states.map((state: string, index: number) => {
        const stateKey = `:state${index}`;
        expressionAttributeValues[stateKey] = state;
        return `#state = ${stateKey}`;
      });
      expressionAttributeNames['#state'] = 'state';
      filterExpressions.push(`(${stateExpressions.join(' OR ')})`);
    }
    
    console.log('Filter expressions:', filterExpressions);
    console.log('Expression attribute values:', expressionAttributeValues);
    console.log('Expression attribute names:', expressionAttributeNames);
    
    // Query DynamoDB with pagination to get complete count
    async function getTotalCount() {
      let totalCount = 0;
      let lastEvaluatedKey: Record<string, any> | undefined = undefined;
      let scanCount = 0;
      
      do {
        scanCount++;
        const scanCommand = new ScanCommand({
          TableName: process.env.TRUCK_TABLE_NAME,
          FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
          ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
          ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
          Select: "COUNT",
          ExclusiveStartKey: lastEvaluatedKey
        });
        
        const result = await docClient.send(scanCommand) as ScanCommandOutput;
        totalCount += result.Count || 0;
        lastEvaluatedKey = result.LastEvaluatedKey;
        
        console.log(`Scan #${scanCount}: Found ${result.Count || 0} trucks, running total: ${totalCount}`);
      } while (lastEvaluatedKey);
      
      console.log(`Total count after full scan: ${totalCount} trucks`);
      return totalCount;
    }
    
    const count = await getTotalCount();
    
    return NextResponse.json({ 
      success: true, 
      count
    });
  } catch (error) {
    console.error("Error counting trucks:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: "Failed to count truck data: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
} 