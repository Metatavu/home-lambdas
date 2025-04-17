import { middyfy } from "src/libs/lambda";
import { questionnaireService } from "src/database/services";
const findQuestionnaireHandler = async (event) => {
    const { id } = event.pathParameters || {};
    try {
        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Missing or invalid path parameter: id",
                }),
            };
        }
        const quizById = await questionnaireService.findQuestionnaire(id);
        if (!quizById) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: "Quiz not found",
                }),
            };
        }
        ;
        return {
            statusCode: 200,
            body: JSON.stringify(quizById),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to retrieve quiz.",
                details: error.message,
            }),
        };
    }
};
export const main = middyfy(findQuestionnaireHandler);
//# sourceMappingURL=handler.js.map