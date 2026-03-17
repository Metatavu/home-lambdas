import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { TrelloService } from "src/services/trello-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Interface for JSON body Trello card data
 */
interface EventBody {
  cardId?: string,
  comment?: string
}

/**
 * Handler for creating a comment on a Trello card
 * 
 * @param event event
 * @returns JSON response
 */
const createCommentHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = event.body as EventBody;

    if (!body?.cardId && !body?.comment) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    const trello = new TrelloService();
    const createdComment = await trello.createComment(body.comment, body.cardId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        cardId: createdComment,
        comment: createdComment
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create trello comment.", details: error.message }),
    };
  }
};

export const main = middyfy(createCommentHandler);