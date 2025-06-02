import type { APIGatewayProxyHandler } from "aws-lambda";
import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";
import type ResourceAllocationModel from "src/types/severa/resourceAllocation/resourceAllocation";
import type SeveraResponseResourceAllocation from "src/types/severa/resourceAllocation/severaResponseResourceAllocation";

/**
 * Handler for getting all resourceAllocation from Severa API.
 * 
 * @param event - API Gateway event containing the severaUserId as queryParams.
 */
export const getResourceAllocationHandler: APIGatewayProxyHandler = async (event) => {
  const {severaUserId} = event.queryStringParameters || {};

  try {
    const api = CreateSeveraApiService();

    const buildResourceAllocationUrl = (severaUserId?: string) => {
      let endpointPath: string;

      if (severaUserId) {
        endpointPath = `users/${severaUserId}/resourceallocations/allocations`;
      } else {
        endpointPath = "resourceallocations";
      }

    const customUrl = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/${endpointPath}`);

    return customUrl;
    }

    const url = buildResourceAllocationUrl(severaUserId);
    const response = await api.getResourceAllocation(url);

    /**
     * Maps the Severa API response data to the ResourceAllocation model.
     *
     * @param {SeveraResponseResourceAllocation[]} severaData - Array of resourceAllocation data from the Severa API.
     * @returns {ResourceAllocationModel[]} - An array of resourceAllocations mapped to the ResourceAllocation model.
     */
    const mappedResourceAllocations = (severaData : SeveraResponseResourceAllocation[]): ResourceAllocationModel[] => (
      severaData.map((resourceAllocation) => ({
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
      }))
  );
  
    const resourceAllocations = mappedResourceAllocations(response);

    return {
      statusCode: 200,
      body: JSON.stringify(resourceAllocations),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

export const main = middyfy(getResourceAllocationHandler);