import { TrelloService } from "src/services/trello-api-service";
import { middyfy } from "src/libs/lambda";
const deleteTrelloCardHandler = async (event) => {
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
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to delete trello card.", details: error.message }),
        };
    }
};
export const main = middyfy(deleteTrelloCardHandler);
//# sourceMappingURL=handler.js.map