import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";
import { FilterUtilities } from "src/libs/filter-utils";
import type WorkHours from "src/types/severa/workHour/workHour";
import type SeveraResponseWorkHours from "src/types/severa/workHour/severaResponseWorkHours";

/**
 * Handler for getting work hours from Severa API.
 *
 * @param event - API Gateway event containing the userId, projectId, and phaseId.
 */
export const getWorkHoursHandler: APIGatewayProxyHandler = async (event) => {
  const { startDate, endDate, severaProjectId, severaPhaseId, severaUserId } = event.queryStringParameters || {};

  try {
    const api = CreateSeveraApiService();
    const optInUsers = await api.getOptInUsers();
    const optInUserGuids = new Set(optInUsers.map((u) => u.guid));

    // If severaProjectId is specified and severaUserId is not, make requests for each opted-in user
    let allWorkHours: SeveraResponseWorkHours[] = [];
    if (severaProjectId) {
      allWorkHours = await api.getFilteredWorkHoursForUsers(optInUsers, severaProjectId, startDate, endDate);
      allWorkHours = allWorkHours.filter((workHours) => workHours.project?.guid == severaProjectId);
    } else {
      if (severaUserId) {
        if (!optInUserGuids.has(severaUserId)) {
          allWorkHours = [];
        } else {
          allWorkHours = await api.getWorkHoursForUser(severaUserId, startDate, endDate);
        }
      } else {
        throw new Error("severaUserId is required when severaProjectId is not specified");
      }
    }

    // Filter work hours by phase if severaPhaseId is provided
    const filteredWorkHours = allWorkHours.filter((workHours: SeveraResponseWorkHours) => {
      if (severaPhaseId) {
        const filteredWorkHoursPhase = FilterUtilities.filterByPhaseSevera(workHours.phase?.guid, severaPhaseId);
        if (!filteredWorkHoursPhase) return false;
      }
      return true;
    });

    /**
     * Maps the Severa API response data to the WorkHours model.
     *
     * @param {SeveraResponseWorkHours[]} severaData - Array of work hours from the Severa API.
     * @returns {WorkHours[]} - An array of work hours mapped to the WorkHours model.
     */
    const mappedWorkHours = (severaData : SeveraResponseWorkHours[]): WorkHours[] => (
      severaData.map((workHours) => ({
        severaWorkHoursId: workHours.guid,
        user: {
          severaUserId: workHours.user?.guid,
          name: workHours.user?.name,
        },
        project: {
          severaProjectId: workHours.project?.guid,
          name: workHours.project?.name,
          isClosed: workHours.project?.isClosed,
        },
        phase: {
          severaPhaseId: workHours.phase?.guid,
          name: workHours.phase?.name,
        },
        description: workHours.description,
        eventDate: workHours.eventDate,
        quantity: workHours.quantity,
        startTime: workHours.startTime,
        endTime: workHours.endTime,
      }))
    );

    const workHours = mappedWorkHours(filteredWorkHours);

    return {
      statusCode: 200,
      body: JSON.stringify(workHours),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export const main = middyfy(getWorkHoursHandler);
