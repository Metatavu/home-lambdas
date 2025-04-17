import { middyfy } from "src/libs/lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
export const getPhasesHandler = async (event) => {
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
        const mappedPhases = (severaData) => severaData.map((phases) => ({
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
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
export const main = middyfy(getPhasesHandler);
//# sourceMappingURL=handler.js.map