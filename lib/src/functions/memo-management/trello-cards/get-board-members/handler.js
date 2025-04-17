import { TrelloService } from "src/services/trello-api-service";
import { middyfy } from "src/libs/lambda";
const getBoardMembersHandler = async () => {
    try {
        const trello = new TrelloService();
        const members = await trello.getBoardMembers();
        return {
            statusCode: 200,
            body: JSON.stringify(members),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch board members' emails.", details: error.message }),
        };
    }
};
export const main = middyfy(getBoardMembersHandler);
//# sourceMappingURL=handler.js.map