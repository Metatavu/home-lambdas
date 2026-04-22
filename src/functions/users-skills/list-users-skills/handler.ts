import type { APIGatewayProxyHandler } from "aws-lambda";
import { usersSkillsService } from "src/database/services";
import type { UsersSkills } from "src/generated/homeLambdasModels/model/usersSkills";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda for listing all users skills from DynamoDB.
 */
const listUsersSkillsHandler: APIGatewayProxyHandler = async () => {
  try {
    const allUsersSkills: UsersSkills[] = await usersSkillsService.listUsersSkills();

    return {
      statusCode: 200,
      body: JSON.stringify(allUsersSkills)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve users skills.",
        details: error.message
      })
    };
  }
};

export const main = middyfy(listUsersSkillsHandler);
