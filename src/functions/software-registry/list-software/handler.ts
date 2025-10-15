import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";
import SoftwareService from "src/database/services/software-service";
import type { SoftwareRegistry } from "src/generated/homeLambdasModels/model/softwareRegistry";
import { middyfy } from "src/libs/lambda";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const softwareService = new SoftwareService(docClient);

/**
 * Handler for listing all software entries from DynamoDB.
 *
 * createdAt and lastUpdatedAt are converted to Date objects to match the spec.
 *
 * @returns Response object with status code and body.
 */
export const listSoftwareHandler: APIGatewayProxyHandler = async () => {
  try {
    const softwareList = await softwareService.listSoftware();
    const softwareRegistryList: SoftwareRegistry[] = softwareList.map((software) => ({
      ...software,
      status: software.status,
      createdAt: software.createdAt ? new Date(software.createdAt) : undefined,
      lastUpdatedAt: software.lastUpdatedAt ? new Date(software.lastUpdatedAt) : undefined
    }));
    return {
      statusCode: 200,
      body: JSON.stringify(softwareRegistryList)
    };
  } catch (error) {
    console.error("Error retrieving software list from DynamoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve software list.", details: error.message })
    };
  }
};

export const main = middyfy(listSoftwareHandler);
