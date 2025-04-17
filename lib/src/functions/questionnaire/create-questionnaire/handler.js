import { middyfy } from "src/libs/lambda";
import { questionnaireService } from "src/database/services";
import { v4 as uuidv4 } from "uuid";
export const createQuestionnaireHandler = async (event) => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Request body is required." })
        };
    }
    const { title, description, questions, tags, passedUsers, passScore } = event.body;
    if (!title || !description || !questions || !passScore) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Some required data is missing !" })
        };
    }
    const newQuestionnaireId = uuidv4();
    let questionnaireResponse = undefined;
    try {
        const createdQuestionnaire = await questionnaireService.createQuestionnaire({
            id: newQuestionnaireId,
            title: title,
            description: description,
            questions: questions,
            tags: tags,
            passedUsers: passedUsers,
            passScore: passScore
        });
        questionnaireResponse = createdQuestionnaire;
        return {
            statusCode: 201,
            body: JSON.stringify(questionnaireResponse)
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: `Failed to create questionnaire entry ${error}`
        };
    }
};
export const main = middyfy(createQuestionnaireHandler);
//# sourceMappingURL=handler.js.map