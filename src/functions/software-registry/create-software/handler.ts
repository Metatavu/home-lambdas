import { dtoToEntity, entityToDto } from "src/database/dtos/softwareRegistryDtos";
import { softwareService } from "src/database/services";
import type { SoftwareRegistry } from "src/generated/homeLambdasModels/model/softwareRegistry";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { getAuthDataFromToken } from "src/libs/auth-utils";
import { middyfy } from "src/libs/lambda";

/**
 * Handler for creating a new software entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code and body.
 */
export const createSoftwareHandler: ValidatedEventAPIGatewayProxyEvent<SoftwareRegistry> = async (
  event
) => {
  try {
    if (!event.body) {
      console.log("Request body is missing");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is required." })
      };
    }

    let data: SoftwareRegistry;
    if (typeof event.body === "string") {
      data = JSON.parse(event.body);
    } else {
      data = event.body as SoftwareRegistry;
    }
    console.log("Parsed request body:", data);

    if (!data.name || !data.url) {
      console.log("Missing required fields: name or url");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Name and URL are required fields." })
      };
    }

    const authData = getAuthDataFromToken(event);
    if (!authData || !authData.sub) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "User is not authenticated." })
      };
    }

    const loggedUserId = authData.sub;
    const now = new Date();

    const newSoftware = {
      name: data.name,
      url: data.url,
      image: data.image,
      description: data.description,
      review: data.review ?? "",
      recommend: data.recommend,
      createdAt: now,
      lastUpdatedAt: now,
      createdBy: loggedUserId,
      lastUpdatedBy: loggedUserId,
      tags: data.tags,
      users: data.users
    };

    const softwareEntity = dtoToEntity(newSoftware);

    const createdSoftware = await softwareService.createSoftware(softwareEntity);

    return {
      statusCode: 201,
      body: JSON.stringify(entityToDto(createdSoftware))
    };
  } catch (error) {
    console.error("Error creating software:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create software entry.", details: error.message })
    };
  }
};

export const main = middyfy(createSoftwareHandler);
