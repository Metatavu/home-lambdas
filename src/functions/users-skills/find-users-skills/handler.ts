import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { usersSkillsService } from "src/database/services";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda for finding a users skills entry from DynamoDB.
 *
 * @param event event
 * @returns users skills information as object
 *
 */
const findUsersSkillsHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing or invalid path parameter: id"
      })
    };
  }

  try {
    const usersSkillsById = await usersSkillsService.findUsersSkills(id);

    if (!usersSkillsById) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Users skills entry not found"
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(usersSkillsById)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve users skills",
        details: error.message
      })
    };
  }
};

export const main = middyfy(findUsersSkillsHandler);
