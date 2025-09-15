import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import SoftwareService from "src/database/services/software-service";
import { middyfy } from "src/libs/lambda";
import { getAuthDataFromToken } from "src/libs/auth-utils"
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { SoftwareRegistry } from "src/generated/homeLambdasModels/model/softwareRegistry";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const softwareService = new SoftwareService(docClient);

/**
 * Handler to update a software item in the DynamoDB table.
 *
 * @param event - API Gateway event containing the request body and path parameters
 * @returns Response object with status code and body
 */
export const updateSoftwareHandler: ValidatedEventAPIGatewayProxyEvent<SoftwareRegistry> = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  try {
    const { id } = event.pathParameters || {};
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing path parameter: id' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required.' }),
      };
    }

    let data: SoftwareRegistry;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    } else {
      data = event.body as SoftwareRegistry;
    }

    const authData  = getAuthDataFromToken(event);
    if (!authData || !authData.sub) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'User is not authenticated.' }),
      };
    }

    const loggedUserId = authData.sub;

    const existingSoftware = await softwareService.findSoftware(id);
    if (!existingSoftware) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Software not found' }),
      };
    }

    const updatedSoftwareData: SoftwareRegistry = {
      name: data.name,
      url: data.url,
      image: data.image,
      description: data.description,
      review: data.review ?? "",
      recommend: data.recommend,
      status: data.status,
      tags: data.tags,
      users: data.users,
      lastUpdatedBy: loggedUserId,
      createdBy: existingSoftware.createdBy
    };

    // NOTE: Type assertion used to bypass type mismatch between SoftwareRegistry and SoftwareModel.
    // review is optional in SoftwareRegistry but required in SoftwareModel.
    // status types also differ
    const updatedSoftware = await softwareService.updateSoftware(id, updatedSoftwareData as any);


    if (!updatedSoftware) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Software not found or no attributes updated' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(updatedSoftware),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update software.', details: error.message }),
    };
  }
};

export const main = middyfy(updateSoftwareHandler);