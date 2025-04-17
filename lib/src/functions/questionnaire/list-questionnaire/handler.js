import { questionnaireService } from "src/database/services";
import { middyfy } from "src/libs/lambda";
const listQuestionnaireHandler = async () => {
    try {
        const allQuestionnaires = await questionnaireService.listQuestionnaires();
        return {
            statusCode: 200,
            body: JSON.stringify(allQuestionnaires),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to retrieve questionnaires.",
                details: error.message,
            }),
        };
    }
};
export const main = middyfy(listQuestionnaireHandler);
//# sourceMappingURL=handler.js.map