import { TrelloService } from "src/services/trello-api-service";
import { middyfy } from "src/libs/lambda";
const createCommentHandler = async (event) => {
    try {
        const body = event.body;
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
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to create trello comment.", details: error.message }),
        };
    }
};
export const main = middyfy(createCommentHandler);
//# sourceMappingURL=handler.js.map