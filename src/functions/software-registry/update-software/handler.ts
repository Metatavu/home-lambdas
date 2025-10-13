import { middyfy } from "src/libs/lambda";
import { getAuthDataFromToken, isAdminUser} from "src/libs/auth-utils"
import type { SoftwareModel } from "src/database/models/software";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import {softwareService} from "src/database/services";
import type { SoftwareRegistry } from "src/generated/homeLambdasModels/model/softwareRegistry";

/**
 * Handler to update a software item in the DynamoDB table.
 *
 * @param event - API Gateway event containing the request body and path parameters
 * @returns Response object with status code and body
 */
export const updateSoftwareHandler: ValidatedEventAPIGatewayProxyEvent<SoftwareRegistry> = async (
  event
) => {

  try {
    if (!isAdminUser(event)) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          code: 403,
          message: "Access denied. Admin privileges required."
        })
      };
    }

    const { id } = event.pathParameters || {};
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing path parameter: id" }) };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Request body is required." }) };
    }

    const data: SoftwareRegistry =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const authData = getAuthDataFromToken(event);
    if (!authData?.sub) {
      return { statusCode: 403, body: JSON.stringify({ error: "User is not authenticated." }) };
    }

    const loggedUserId = authData.sub;

    const existingSoftware = await softwareService.findSoftware(id);
    if (!existingSoftware) {
      return { statusCode: 404, body: JSON.stringify({ error: "Software not found" }) };
    }

    /**
     * Build the full update object directly as SoftwareModel
     */
    const updatedSoftware: SoftwareModel = {
      id: existingSoftware.id,
      name: data.name,
      url: data.url,
      image: data.image,
      description: data.description,
      review: data.review ?? "",
      recommend: data.recommend,
      status: data.status,
      tags: data.tags,
      users: data.users,
      createdBy: existingSoftware.createdBy,
      createdAt: existingSoftware.createdAt,
      lastUpdatedBy: loggedUserId,
      lastUpdatedAt: new Date().toISOString()
    };

    const result = await softwareService.updateSoftware(id, updatedSoftware);

    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Software not found or no attributes updated" })
      };
    }

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update software.", details: error.message })
    };
  }
};

export const main = middyfy(updateSoftwareHandler);
