import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";
export const getResourceAllocationHandler = async (event) => {
    const { severaUserId } = event.queryStringParameters || {};
    try {
        const api = CreateSeveraApiService();
        const buildResourceAllocationUrl = (severaUserId) => {
            let endpointPath;
            if (severaUserId) {
                endpointPath = `users/${severaUserId}/resourceallocations/allocations`;
            }
            else {
                endpointPath = "resourceallocations";
            }
            const customUrl = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/${endpointPath}`);
            return customUrl;
        };
        const url = buildResourceAllocationUrl(severaUserId);
        const response = await api.getResourceAllocation(url);
        const mappedResourceAllocations = (severaData) => (severaData.map((resourceAllocation) => ({
            severaResourceAllocationId: resourceAllocation.guid,
            allocationHours: resourceAllocation.allocationHours,
            calculatedAllocationHours: resourceAllocation.calculatedAllocationHours,
            phase: {
                severaPhaseId: resourceAllocation.phase?.guid,
                name: resourceAllocation.phase?.name,
            },
            user: {
                severaUserId: resourceAllocation.user?.guid,
                name: resourceAllocation.user?.name,
            },
            project: {
                severaProjectId: resourceAllocation.project?.guid,
                name: resourceAllocation.project?.name,
                isInternal: resourceAllocation.project?.isInternal,
            },
        })));
        const resourceAllocations = mappedResourceAllocations(response);
        return {
            statusCode: 200,
            body: JSON.stringify(resourceAllocations),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
export const main = middyfy(getResourceAllocationHandler);
//# sourceMappingURL=handler.js.map