import { middyfy } from "src/libs/lambda";
import { questionnaireService } from "src/database/services";
import { v4 as uuidv4 } from "uuid";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import questionnaireSchema from "src/schema/questionnaire";
import { Questionnaire } from "src/generated/homeLambdasModels/model/questionnaire";

export const createQuestionnaireHandler: ValidatedEventAPIGatewayProxyEvent<typeof questionnaireSchema> = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required." })
    };
  }

  // Parse body if needed
  let body: unknown = event.body;
  if (typeof event.body === "string") {
    body = JSON.parse(event.body);
  }

  // Validate with questionnaireSchema
  const parsed = questionnaireSchema.safeParse(body);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid questionnaire data", details: parsed.error })
    };
  }

  const { title, description, questions, tags, passedUsers, passScore } = parsed.data;

  if (!title || !description || !questions || !passScore) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Some required data is missing !" })
    };
  }

  const newQuestionnaireId: string = uuidv4();
  let questionnaireResponse: Questionnaire | undefined = undefined;

  try {
    /**
     * NOTE:
     * There may be a type mismatch: OpenAPI model defines passedUsers as string[],
     * but the service expects number[]. This may cause issues if user IDs are not numbers.
     * Consider refactoring the service or updating the spec for consistency.
     */
    const createdQuestionnaire = await questionnaireService.createQuestionnaire({
      id: newQuestionnaireId,
      title,
      description,
      questions,
      tags,
      passedUsers,
      passScore
    });

    questionnaireResponse = createdQuestionnaire as unknown as Questionnaire;

    return {
      statusCode: 201,
      body: JSON.stringify(questionnaireResponse)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Failed to create questionnaire entry ${error}`
    }
  }
};

export const main = middyfy(createQuestionnaireHandler);