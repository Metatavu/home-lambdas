import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { usersSkillsService } from "src/database/services";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda for deleting a users skills entry from DynamoDB.
 *
 * @param event event
 */
const deleteUsersSkillsHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
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
    const foundUsersSkillsById = await usersSkillsService.findUsersSkills(id);
    if (!foundUsersSkillsById) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Users skills with id: ${id} not found.`
        })
      };
    }

    await usersSkillsService.deleteUsersSkills(id);
    return {
      statusCode: 204,
      body: JSON.stringify("Users skills entry deleted successfully.")
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to delete users skills.",
        details: error.message
      })
    };
  }
};

export const main = middyfy(deleteUsersSkillsHandler);
