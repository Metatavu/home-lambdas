import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Creates DynamoDB DocumentClient (AWS SDK v3)
 * 
 * @returns created DynamoDB DocumentClient
 */
const createDynamoDBClient = (): DynamoDBDocumentClient => {
  const client = process.env.IS_OFFLINE
    ? new DynamoDBClient({
        region: "localhost",
        endpoint: "http://localhost:8000",
      })
    : new DynamoDBClient({});

  return DynamoDBDocumentClient.from(client);
};

export default createDynamoDBClient;