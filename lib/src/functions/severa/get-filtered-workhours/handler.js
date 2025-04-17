import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";
import { FilterUtilities } from "src/libs/filter-utils";
export const getWorkHoursHandler = async (event) => {
    const { startDate, endDate, severaProjectId, severaPhaseId, severaUserId } = event.queryStringParameters || {};
    try {
        const api = CreateSeveraApiService();
        const buildWorkHoursUrl = (severaProjectId, severaUserId, startDate, endDate) => {
            let endpointPath;
            if (severaProjectId) {
                endpointPath = `projects/${severaProjectId}/workhours`;
            }
            else if (severaUserId) {
                endpointPath = `users/${severaUserId}/workhours`;
            }
            else {
                endpointPath = "workhours";
            }
            const customUrl = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/${endpointPath}`);
            if (startDate)
                customUrl.searchParams.append("startDate", startDate);
            if (endDate)
                customUrl.searchParams.append("endDate", endDate);
            return customUrl;
        };
        const url = buildWorkHoursUrl(severaProjectId, severaUserId, startDate, endDate);
        const response = await api.getWorkHours(url);
        const filteredWorkHours = response.filter((workHours) => {
            if (severaProjectId && severaUserId) {
                const filteredWorkHoursUserProject = FilterUtilities.filterByUserSevera(workHours.user?.guid, severaUserId);
                if (!filteredWorkHoursUserProject)
                    return false;
            }
            if (severaPhaseId) {
                const filteredWorkHoursPhase = FilterUtilities.filterByPhaseSevera(workHours.phase?.guid, severaPhaseId);
                if (!filteredWorkHoursPhase)
                    return false;
            }
            return true;
        });
        const mappedWorkHours = (severaData) => (severaData.map((workHours) => ({
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
        })));
        const workHours = mappedWorkHours(filteredWorkHours);
        return {
            statusCode: 200,
            body: JSON.stringify(workHours),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
export const main = middyfy(getWorkHoursHandler);
//# sourceMappingURL=handler.js.map