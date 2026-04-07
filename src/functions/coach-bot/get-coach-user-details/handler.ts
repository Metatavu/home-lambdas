import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { coachBotApiService } from "src/database/services";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { CoachUserDetailsResponse } from "src/generated/homeLambdasModels/model/coachUserDetailsResponse";
import {
  difficultyToEnum,
  normalizeQuizRole,src/libs/coach-bot-utils/streak-utils
  roleToEnum
} from "src/libs/coach-bot-utils/coach-bot-utils";
import { middyfy } from "src/libs/lambda";
import { calculateDifficulty } from "src/libs/streak-utils";

const getCoachUserDetailsHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { userId } = event.pathParameters ?? {};
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing path parameter: userId" })
      };
    }

    const keycloakApi = CreateKeycloakApiService();

    const user = await keycloakApi.findUser(userId);
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

    const streak = await coachBotApiService.getUserStreak(slackUserId);

    //Calculate difficulty based on streak and convert role and difficulty to enums for response
    const difficulty = calculateDifficulty(streak);
    const roleEnum = roleToEnum(normalizedRole) as CoachUserDetailsResponse.RoleEnum;
    const difficultyEnum = difficultyToEnum(difficulty) as CoachUserDetailsResponse.DifficultyEnum;

    const responseBody: CoachUserDetailsResponse = {
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

export const main = middyfy(getCoachUserDetailsHandler);
