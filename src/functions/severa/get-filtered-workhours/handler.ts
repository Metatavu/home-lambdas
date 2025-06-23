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

    // If severaProjectId is specified and severaUserId is not, make requests for each opted-in user
    let allWorkHours: SeveraResponseWorkHours[] = [];
    if (severaProjectId) {
      // Request in parallel for each opted-in user
      const workHoursResults = await Promise.all(
        optInUsers.map(async (user) => {
          try {
            const url = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/users/${user.guid}/workhours`);
            url.searchParams.append("projectGuid", severaProjectId);
            if (startDate) url.searchParams.append("startDate", startDate);
            if (endDate) url.searchParams.append("endDate", endDate);
            const userWorkHours = await api.getWorkHours(url);
            return userWorkHours;
          } catch (e) {
            // If there is an error for a single user, just skip
            return [];
          }
        })
      );
      // Combine all results
      allWorkHours = workHoursResults.flat();
      // Filtering only for the specified project
      allWorkHours = allWorkHours.filter(
        (workHours) => workHours.project?.guid == severaProjectId
      );
    } else {
      // Standard logic for other cases (by userId or without projectId)
      // Manually build the URL since buildWorkHoursUrl does not exist
      let url: URL;
      if (severaUserId) {
        url = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/users/${severaUserId}/workhours`);
      } else {
      // Absolute endpoint, fetching all work hours
      url = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/workhours`);
      }
      if (startDate) url.searchParams.append("startDate", startDate);
      if (endDate) url.searchParams.append("endDate", endDate);

      allWorkHours = await api.getWorkHours(url);
    }

    // Filter by opted-in users (just in case there are any "unauthorized" users in the response)
    const filteredWorkHours = allWorkHours.filter((workHours: SeveraResponseWorkHours) => {
      if (!workHours.user?.guid || !optInUserGuids.has(workHours.user.guid)) {
        return false;
      }
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
