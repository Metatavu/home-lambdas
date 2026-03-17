import type { APIGatewayProxyHandler } from "aws-lambda";
import type { TrelloCardWithComments } from "src/schema/trello";
import { TrelloService } from "src/services/trello-api-service";
import { middyfy } from "src/libs/lambda";

/**
 * Handler for listing cards on a Trello list
 * 
 * @returns JSON responce
 */
const getTrelloCardsOnListHandler: APIGatewayProxyHandler = async () => {
  try {
    const trello = new TrelloService();
    const cards = await trello.getCardsOnList();
    const cardsComments = await trello.getCardsComments(cards);

    const cardsParsed: TrelloCardWithComments[] = cards.map((card, index) => ({
      ...card,
      comments: cardsComments[index]
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(cardsParsed),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch trello cards.", details: error.message }),
    };
  }
};

export const main = middyfy(getTrelloCardsOnListHandler);