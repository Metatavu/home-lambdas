import { usersSkillsService } from "src/database/services";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { middyfy } from "src/libs/lambda";
import type usersSkillsSchema from "src/schema/usersSkills";
import { v4 as uuidv4 } from "uuid";
import UsersSkillsModel from "@database/models/usersSkills";

/**
 * Handler for creating a new users skills entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 */
export const createUsersSkillsHandler: ValidatedEventAPIGatewayProxyEvent<
  typeof usersSkillsSchema
> = async (event) => {
  const { body } = event;
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required." })
    };
  }

  const { name, skills } = body;

  if (!name || !skills) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body. Some data is missing." })
    };
  }

  const newUsersSkillsId = uuidv4();
  // TODO This will be added after API specs are altered to have userID
  // const api = CreateKeycloakApiService();
  // const userDetails = await api.findUser(userId);

  try {
    const newUsersSkills: UsersSkillsModel = {
      id: newUsersSkillsId,
      name,
      skills
    };

    const createdUsersSkills = await usersSkillsService.createUsersSkills(newUsersSkills);

    return {
      statusCode: 201,
      body: JSON.stringify(createdUsersSkills)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Failed to create users skills entry ${error}`
    };
  }
};

export const main = middyfy(createUsersSkillsHandler);
