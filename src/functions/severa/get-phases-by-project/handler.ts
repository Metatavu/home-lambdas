import type { APIGatewayProxyHandler } from "aws-lambda";
import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import type SeveraResponsePhases from "src/types/severa/phase/severaResponsePhases";
import type PhaseModel from "src/types/severa/phase/phase";

/**
 * Handler for getting Phases by project from Severa REST API.
 *
 * @param event - API Gateway event containing the userId.
 */
export const getPhasesHandler: APIGatewayProxyHandler = async (event) => {
  const { severaProjectId } = event.pathParameters;

  try {
    const api = CreateSeveraApiService();

    if (!severaProjectId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Project Id is required" }),
      };
    }

    const response = await api.getPhasesBySeveraProjectId(severaProjectId);

    /**
     * Maps the Severa API response data to the Phase model.
     *
     * @param {SeveraResponsePhases[]} severaData - Array of phases from the Severa API.
     * @returns {PhaseModel[]} - An array of phases mapped to the Phase model.
     */
    const mappedPhases = (severaData: SeveraResponsePhases[]): PhaseModel[] =>
      severaData.map((phases) => ({
        severaPhaseId: phases.guid,
        name: phases.name,
        isCompleted: phases.isCompleted,
        workHoursEstimate: phases.workHoursEstimate,
        startDate: phases.startDate,
        deadline: phases.deadline,
        project: {
          severaProjectId: phases.project.guid,
          name: phases.project.name,
          isClosed: phases.project.isClosed,
        },
      }));
    const phases = mappedPhases(response);

    return {
      statusCode: 200,
      body: JSON.stringify(phases),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export const main = middyfy(getPhasesHandler);
