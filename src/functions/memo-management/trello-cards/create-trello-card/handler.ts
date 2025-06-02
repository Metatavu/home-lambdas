import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { TrelloService } from "src/services/trello-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Interface for JSON body trello card data
 */
interface EventBody {
  title?: string,
  description?: string
}

/**
 * Handler for card creation
 * 
 * @param event event
 * @returns JSON responce
 */
const createTrelloCardHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = event.body as EventBody;

    if (!body?.title && !body?.description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" })
      };
    } 

    const trello = new TrelloService();
    const newCard = await trello.createCard(body.title, body.description);

    return {
      statusCode: 200,
      body: JSON.stringify({
        cardId: newCard.shortLink,
        title: newCard.name,
        description: newCard.desc
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create trello card.", details: error.message }),
    };
  }
};

export const main = middyfy(createTrelloCardHandler);