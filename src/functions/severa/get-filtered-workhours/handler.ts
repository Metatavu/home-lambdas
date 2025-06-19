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

    // Getting the list of opted in users
    const optInUsers = await api.getOptInUsers();
    const optInUserGuids = new Set(optInUsers.map((u) => u.guid));

    /**
     * Construct a custom url for fetching workHours with required queryParams.
     *
     * @param severaProjectId - Severa project id
     * @param severaUserId - Severa user id
     * @param startDate - Start date for work hours
     * @param endDate - End date for work hours
     *
     * @returns {string} - The constructed custom URL for fetching work hours.
     */
    const buildWorkHoursUrl = async (severaProjectId?: string, severaUserId?: string, startDate?: string, endDate?: string) => {
      let endpointPath: string;
      try {
      await api.getKeywordIdForUser(severaUserId, "isSeveraOptIn");
    } catch {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "User has not opted in." }),
      };
    }

      if (severaProjectId) {
        endpointPath = `projects/${severaProjectId}/workhours`;
      } else if (severaUserId) {
      if (severaUserId && !optInUserGuids.has(severaUserId)) {
        throw new Error("User has not opted in.");
      }
        endpointPath = `users/${severaUserId}/workhours`;
      } else {
        endpointPath = "workhours";
      }

      const customUrl = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/${endpointPath}`);

      if (startDate) customUrl.searchParams.append("startDate", startDate);
      if (endDate) customUrl.searchParams.append("endDate", endDate);

      return customUrl;
    };

    const url = await buildWorkHoursUrl(severaProjectId, severaUserId, startDate, endDate);
    if (!(url instanceof URL)) {
      // url is an error response object, return it directly
      return url;
    }
    const response = await api.getWorkHours(url);

    // Filtering by opted in users only
    const filteredWorkHours = response.filter((workHours: SeveraResponseWorkHours) => {
      if (!workHours.user?.guid || !optInUserGuids.has(workHours.user.guid)) {
        return false;
      }
      /**
       * Note: If severaProjectId and severaUserId are both true, the work hours data
       * will be filtered by project in the Severa API call due to workHours custom url.
       */
      if (severaProjectId && severaUserId) {
        const filteredWorkHoursUserProject = FilterUtilities.filterByUserSevera(workHours.user?.guid, severaUserId);
        if (!filteredWorkHoursUserProject) return false ;
      }

      if (severaPhaseId) {
        const filteredWorkHoursPhase = FilterUtilities.filterByPhaseSevera(workHours.phase?.guid, severaPhaseId);
        if (!filteredWorkHoursPhase) return false ;
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

    const workHours = mappedWorkHours(filteredWorkHours)

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
