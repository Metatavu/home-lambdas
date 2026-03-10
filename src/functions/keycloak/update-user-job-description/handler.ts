import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";

const VALID_JOB_DESCRIPTIONS = [
  "DEVELOPER",
  "DESIGNER",
  "ARCHITECT",
  "ADMIN",
  "MANAGEMENT",
  "TRAINEE"
] as const;

type JobDescriptionRole = (typeof VALID_JOB_DESCRIPTIONS)[number];

/**
 * Lambda handler to update a user's self-selected job description roles in Keycloak.
 *
 * @param event API Gateway event containing userId path parameter and jobDescriptions in body
 * @returns Response message as JSON string
 */
const updateUserJobDescriptionHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const userId = event.pathParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "User ID is required" })
    };
  }

  try {
    const requestBody =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { jobDescriptions } = requestBody as { jobDescriptions: JobDescriptionRole[] };

    if (!Array.isArray(jobDescriptions)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "jobDescriptions must be an array" })
      };
    }

    const invalid = jobDescriptions.filter((r) => !VALID_JOB_DESCRIPTIONS.includes(r));
    if (invalid.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Invalid job description roles: ${invalid.join(", ")}. Allowed values: ${VALID_JOB_DESCRIPTIONS.join(", ")}`
        })
      };
    }

    const keycloakApi = CreateKeycloakApiService();

    await keycloakApi.updateUserAttributes(userId, {
      jobDescriptions: jobDescriptions
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Job description roles updated successfully." })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : "An unknown error occurred"
      })
    };
  }
};

export const main = middyfy(updateUserJobDescriptionHandler);
