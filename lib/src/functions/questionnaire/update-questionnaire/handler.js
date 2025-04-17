import { middyfy } from "@libs/lambda";
import { questionnaireService } from "src/database/services";
const updateQuestionnaireHandler = async (event) => {
    const { pathParameters, body } = event;
    const id = pathParameters?.id;
    const { title, description, questions, tags, passedUsers, passScore, } = body;
    if (!id) {
        return {
            statusCode: 400,
            body: "Bad request, missing id"
        };
    }
    const existingQuestionnaire = await questionnaireService.findQuestionnaire(id);
    if (!existingQuestionnaire) {
        return {
            statusCode: 404,
            body: `Questionnaire ${id} not found`
        };
    }
    const questionnaireUpdates = {
        id: existingQuestionnaire.id,
        title: title,
        description: description,
        questions: questions,
        tags: tags,
        passedUsers: passedUsers,
        passScore: passScore,
    };
    try {
        const updatedQuestionnaire = await questionnaireService.updateQuestionnaire(questionnaireUpdates);
        return {
            statusCode: 200,
            body: JSON.stringify(updatedQuestionnaire)
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: `Error updating questionnaire record with id ${id}, ${error}`
        };
    }
};
export const main = middyfy(updateQuestionnaireHandler);
//# sourceMappingURL=handler.js.map