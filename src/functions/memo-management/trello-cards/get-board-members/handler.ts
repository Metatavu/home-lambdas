import type { APIGatewayProxyHandler } from "aws-lambda";
import { TrelloService } from "src/services/trello-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Handler for fetching email addresses of Trello board members
 * 
 * @returns JSON response
 */
const getBoardMembersHandler: APIGatewayProxyHandler = async () => {
  try {
    const trello = new TrelloService();
    const members = await trello.getBoardMembers();

    return {
      statusCode: 200,
      body: JSON.stringify(members),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch board members' emails.", details: error.message }),
    };
  }
};

export const main = middyfy(getBoardMembersHandler);