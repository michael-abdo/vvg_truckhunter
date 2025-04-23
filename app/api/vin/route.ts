import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin");
  
  if (!vin) {
    return NextResponse.json({ error: "VIN parameter is required" }, { status: 400 });
  }
  
  try {
    // Use QueryCommand for GSI
    const command = new QueryCommand({
      TableName: process.env.TRUCK_TABLE_NAME,
      IndexName: "vin-index",
      KeyConditionExpression: "vin = :vinValue",
      ExpressionAttributeValues: {
        ":vinValue": vin
      }
    });
    
    console.log(`Executing query for VIN: ${vin} on table: ${process.env.TRUCK_TABLE_NAME}, index: vin-index`);
    
    const response = await docClient.send(command);
    const truck = response.Items && response.Items.length > 0 ? response.Items[0] : null;
    
    // Log the full truck data from database
    console.log("Database response:", JSON.stringify(response, null, 2));
    console.log("Truck data:", JSON.stringify(truck, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      truck,
      // Include the raw data for debugging
      debug: {
        itemCount: response.Count,
        scannedCount: response.ScannedCount,
        lastEvaluatedKey: response.LastEvaluatedKey
      }
    });
  } catch (error) {
    console.error("Error querying VIN:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch truck data",
      errorDetails: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 