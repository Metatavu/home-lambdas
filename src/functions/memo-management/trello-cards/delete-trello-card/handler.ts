import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { TrelloService } from "src/services/trello-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Handler for card deleting
 * 
 * @param event event
 * @returns JSON responce
 */
const deleteTrelloCardHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters || {};

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }
    
    const trello = new TrelloService();
    const result = await trello.deleteCard(id);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Card deleted successfully", result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete trello card.", details: error.message }),
    };
  }
};

export const main = middyfy(deleteTrelloCardHandler);