import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import SoftwareService from "src/database/services/software-service";
import { middyfy } from "src/libs/lambda";
import { SoftwareRegistry } from "src/generated/homeLambdasModels/model/softwareRegistry";

const dynamoDb = new DocumentClient();
const softwareService = new SoftwareService(dynamoDb);

/**
 * Handler for retrieving a software entry from DynamoDB.
 * 
 * @param event - API Gateway event containing the path parameters.
 * @returns Response object with status code and body.
 */
export const findSoftwareHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  console.log('Received event:', JSON.stringify(event));

  const { id } = event.pathParameters || {};
  console.log('Path parameter (id):', id);

  if (!id) {
    console.log("Missing or invalid path parameter: id");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing or invalid path parameter: id' }),
    };
  }

  try {
    console.log('Finding software with id:', id);
    const software = await softwareService.findSoftware(id);

    if (software) {
      const fixedSoftware: SoftwareRegistry = {
        ...software,
        // NOTE: TS types for status for status differ between SoftwareModel and SoftwareRegistry.
        // This cast ensures compatibility with the OpenAPI spec model without modifying generated types.
        status: software.status as unknown as SoftwareRegistry["status"],
        // NOTE: createdAt and lastUpdatedAt are converted to Date objects to match the OpenAPI spec model.
        createdAt: software.createdAt ? new Date(software.createdAt) : undefined,
        lastUpdatedAt: software.lastUpdatedAt ? new Date(software.lastUpdatedAt) : undefined
      };
      console.log('Software found:', fixedSoftware);
      return {
        statusCode: 200,
        body: JSON.stringify(fixedSoftware),
      };
    } else {
      console.error("Software not found for id:", id);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Software not found' }),
      };
    }
  } catch (error) {
    console.error('DynamoDB error finding software:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve software.', details: error.message }),
    };
  }
};

export const main = middyfy(findSoftwareHandler);
