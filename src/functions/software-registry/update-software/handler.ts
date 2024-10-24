import { DocumentClient } from "aws-sdk/clients/dynamodb";
import SoftwareService from "src/database/services/software-service";
import { middyfy } from "src/libs/lambda";
import { getUserIdFromToken } from "src/libs/auth-utils"
import { SoftwareModel } from "src/database/models/software";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";

const dynamoDb = new DocumentClient();
const softwareService = new SoftwareService(dynamoDb);

/**
 * Handler to update a software item in the DynamoDB table.
 * 
 * @param event - API Gateway event containing the request body and path parameters
 * @returns Response object with status code and body
 */
export const updateSoftwareHandler: ValidatedEventAPIGatewayProxyEvent<SoftwareModel> = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  try {
    const { id } = event.pathParameters || {};
    console.log('Path parameter (id):', id);

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

    let data: SoftwareModel;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    } else {
      data = event.body as SoftwareModel;
    }
    console.log('Parsed request body:', data);

    const authData  = getAuthDataFromToken(event);
    if (!authData || !authData.sub) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'User is not authenticated.' }),
      };
    }

    const loggedUserId = authData.sub;

    console.log('Looking up existing software by id:', id);
    const existingSoftware = await softwareService.findSoftware(id);
    if (!existingSoftware) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Software not found' }),
      };
    }
    console.log('Existing software found:', existingSoftware);

    const updatedSoftwareData: SoftwareModel = {
      name: data.name,
      url: data.url,
      image: data.image,
      description: data.description,
      review: data.review,
      recommend: data.recommend,
      status: data.status,
      tags: data.tags,
      users: data.users,
      lastUpdatedBy: loggedUserId,
      createdBy: existingSoftware.createdBy
    };
    console.log('Updating software with data:', updatedSoftwareData);

    const updatedSoftware = await softwareService.updateSoftware(id, updatedSoftwareData);

    if (!updatedSoftware) {
      console.error("Failed to update software for id:", id);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Software not found or no attributes updated' }),
      };
    }

    console.log('Software updated successfully:', updatedSoftware);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedSoftware),
    };
  } catch (error) {
    console.error('DynamoDB update error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update software.', details: error.message }),
    };
  }
};

export const main = middyfy(updateSoftwareHandler);
