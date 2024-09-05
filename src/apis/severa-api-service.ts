import { Allocation } from "./schemas/severa/allocations"
import fetch from "node-fetch";

interface ListAllocationsParameters {
  startDate?: Date,
  endDate?: Date,
  userGuids?: string[],
  projectGuids?: string[],
}

export interface SeveraApiService {
  getAllocations: (parameters) => Promise<Allocation[]>;
}

let tokenCached = null;

/**
 * Creates SeveraApiService
 */
export function CreateSeveraApiService(): SeveraApiService {
  const apiKey: string = process.env.SEVERA_API_KEY;
  const clientID: string = process.env.SEVERA_CLIENT_ID;
  const clientSecret: string = process.env.SEVERA_CLIENT_SECRET;

  async function getToken() {
    if (!tokenCached || new Date() >= new Date(tokenCached.access_token_expires_utc)) {
  

      const tokenBody = {
        client_id: clientID,
        client_secret: clientSecret,
        scope: "resourceallocations:read, projects:read"
      }

      const tokenResponse = await fetch("https://api.severa.visma.com/rest-api/v1/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tokenBody)
      });

      const tokenData = await tokenResponse.json();  
      // Save the new token and its expiration time in the cache
      tokenCached = {
        access_token: tokenData.access_token,
        access_token_expires_utc: tokenData.access_token_expires_utc,
      };
    } else {
      console.log("Using cached token...");
    }
  
    return tokenCached.access_token;
  }

  return {
    /**
     * Gets all allocations from the api
     *
     * @returns List of allocations
     */
    async getAllocations(parameters: ListAllocationsParameters): Promise<Allocation[]> {
      console.log("parameters are:",parameters)
      console.log("start")
      // Initialize the body object with required properties
      const body: ListAllocationsParameters = {
      };
      if (parameters.startDate) {
        body.startDate = parameters.startDate;
      }
      if (parameters.endDate) {
        body.endDate = parameters.endDate;
      }
      if (parameters.userGuids) {
        body.userGuids = parameters.userGuids;
      }
      if (parameters.projectGuids) {
        body.projectGuids = parameters.projectGuids;
      }

      const bearer = await getToken();
      console.log("token got")

      const response = await fetch("https://api.severa.visma.com/rest-api/v1/resourceallocations/allocations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bearer}`,
          "Content-Type": "application/json",
          "Client_id": clientID
        },
        body: JSON.stringify(body)
      });
      console.log("last")
      return response.json();
    },
  }
}