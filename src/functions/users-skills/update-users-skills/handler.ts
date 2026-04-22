import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { usersSkillsService } from "src/database/services";
import type usersSkillsSchema from "src/schema/usersSkills";
import UsersSkillsModel from "@database/models/usersSkills";

/**
 * Lambda function to update a users skills entry
 *
 * @param event event containing path parameters and a JSON body that matches 'usersSkillsSchema'
 * @return A response object with statuscode
 */
const updateUsersSkillsHandler: ValidatedEventAPIGatewayProxyEvent<
  typeof usersSkillsSchema
> = async (event) => {
  const { pathParameters, body } = event;
  const { name, skills } = body;
  const id = pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: "Bad request, missing id"
    };
  }

  if (!name || !skills) {
    return {
      statusCode: 400,
      body: "Invalid request body. Some data is missing."
    };
  }

  const existingUsersSkills = await usersSkillsService.findUsersSkills(id);
  if (!existingUsersSkills) {
    return {
      statusCode: 404,
      body: `Users skills ${id} not found`
    };
  }

  const usersSkillsUpdates: UsersSkillsModel = {
    id: id,
    name: existingUsersSkills.name,
    skills: skills
  };

  try {
    const updatedUsersSkills = await usersSkillsService.updateUsersSkills(usersSkillsUpdates);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedUsersSkills)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error updating users skills record with id ${id}, ${error}`
    };
  }
};

export const main = middyfy(updateUsersSkillsHandler);
