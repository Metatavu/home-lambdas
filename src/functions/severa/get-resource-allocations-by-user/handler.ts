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
    // Getting the list of opted in users
    const optInUsers = await api.getOptInUsers();

    const buildResourceAllocationUrl = (severaUserId?: string) => {
      let endpointPath: string;

      if (severaUserId) {
        endpointPath = `users/${severaUserId}/resourceallocations/allocations`;
        const customUrl = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/${endpointPath}`);
        return customUrl;
      } else {
        // If severaUserId is not specified, we make requests for each opted-in user and merge the results
        return null; // special marker that we need to iterate over all opted-in
      }
    }

    const url = buildResourceAllocationUrl(severaUserId);
    let allResourceAllocations: SeveraResponseResourceAllocation[] = [];

    if (url) {
      // Normal case: for a specific user
      const response = await api.getResourceAllocation(url);
      allResourceAllocations = response;
    } else {
      // Like in get-filtered-workhours: we collect for all opted-in
      const resourceAllocationsResults = await Promise.all(
        optInUsers.map(async (user: { guid: string }) => {
          try {
            const userUrl = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/users/${user.guid}/resourceallocations/allocations`);
            const userResourceAllocations = await api.getResourceAllocation(userUrl);
            return userResourceAllocations;
          } catch (e) {
            // We can add error handling per user if needed
            return [];
          }
        })
      );
      allResourceAllocations = resourceAllocationsResults.flat();
    }

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
    const resourceAllocations = mappedResourceAllocations(allResourceAllocations);

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