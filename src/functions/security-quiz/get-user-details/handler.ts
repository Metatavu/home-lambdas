import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { securityQuizApiService } from "src/database/services";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { QuizUserDetailsResponse } from "src/generated/homeLambdasModels/model/quizUserDetailsResponse";
import { middyfy } from "src/libs/lambda";
import { difficultyToEnum, normalizeQuizRole, roleToEnum } from "src/libs/security-quiz-utils";
import { calculateDifficulty } from "src/libs/streak-utils";

const getUserDetailsHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters ?? {};
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing path parameter: id" })
      };
    }

    const keycloakApi = CreateKeycloakApiService();

    const user = await keycloakApi.findUser(id);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" })
      };
    }

    const slackUserId = user.attributes?.slackUserId?.[0];
    const role = user.attributes?.role?.[0];

    if (!slackUserId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User missing slackUserId attribute" })
      };
    }

    const normalizedRole = normalizeQuizRole(role);

    const streak = await securityQuizApiService.getUserStreak(slackUserId);

    //Calculate difficulty based on streak and convert role and difficulty to enums for response
    const difficulty = calculateDifficulty(streak);
    const roleEnum = roleToEnum(normalizedRole) as QuizUserDetailsResponse.RoleEnum;
    const difficultyEnum = difficultyToEnum(difficulty) as QuizUserDetailsResponse.DifficultyEnum;

    const responseBody: QuizUserDetailsResponse = {
      slackUserId: slackUserId,
      role: roleEnum,
      difficulty: difficultyEnum
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responseBody)
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal server error" })
    };
  }
};

export const main = middyfy(getUserDetailsHandler);
