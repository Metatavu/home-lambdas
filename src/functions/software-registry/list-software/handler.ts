import { APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import SoftwareService from "src/database/services/software-service";
import { middyfy } from "src/libs/lambda";
import { SoftwareRegistry } from "src/generated/homeLambdasModels/model/softwareRegistry";

/**
 * Handler for listing all software entries from DynamoDB.
 * 
 * NOTE: Returned response matches the SoftwareRegistry OpenAPI spec model.
 * If there are differences in the status field type, it is cast to match the spec.
 * createdAt and lastUpdatedAt are converted to Date objects to match the spec.
 * 
 * @returns Response object with status code and body.
 */
const dynamoDb = new DocumentClient();
const softwareService = new SoftwareService(dynamoDb);

export const listSoftwareHandler: APIGatewayProxyHandler = async () => {
  console.log('Received request to list software entries');

  try {
    console.log('Fetching software list from DynamoDB');
    const softwareList = await softwareService.listSoftware();

    // Map SoftwareModel[] to SoftwareRegistry[]
    const softwareRegistryList: SoftwareRegistry[] = softwareList.map((software) => ({
      ...software,
      // Cast status to match SoftwareRegistry type
      status: software.status as unknown as SoftwareRegistry["status"],
      // Convert dates if needed
      createdAt: software.createdAt ? new Date(software.createdAt) : undefined,
      lastUpdatedAt: software.lastUpdatedAt ? new Date(software.lastUpdatedAt) : undefined,
    }));

    console.log('Software list retrieved successfully:', softwareRegistryList);
    return {
      statusCode: 200,
      body: JSON.stringify(softwareRegistryList),
    };
  } catch (error) {
    console.error("Error retrieving software list from DynamoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve software list.', details: error.message }),
    };
  }
};

export const main = middyfy(listSoftwareHandler);