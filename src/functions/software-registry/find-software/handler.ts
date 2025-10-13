import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { middyfy } from "src/libs/lambda";
import {softwareService} from "src/database/services";

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
      console.log('Software found:', software);
      return {
        statusCode: 200,
        body: JSON.stringify(software),
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
