import fetch from "node-fetch";
import type { KeywordModel } from "../generated/severaClient/models/KeywordModel";
import type { UserOutputModel } from "../generated/severaClient/models/UserOutputModel";
import type { UserKeywordModel } from "../generated/severaClient/models/UserKeywordModel";
import type { Flextime } from "../types/severa/flexTime/flexTime";
import { DateTime } from "luxon";
import TimeUtilities from "src/meta-assistant/generic/time-utils";
import type SeveraResponseWorkHours from "src/types/severa/workHour/severaResponseWorkHours";
import type SeveraResponsePhases from "src/types/severa/phase/severaResponsePhases";
import type SeveraResponseResourceAllocation from "src/types/severa/resourceAllocation/severaResponseResourceAllocation";
import type SeveraResponsePreviousWorkHours from "src/types/severa/previousWorkHours/severaResponsePreviousWorkHours";
import type SeveraResponseWorkDays from "src/types/severa/workDays/severaResponseWorkDays";
import type SeveraResponseUser from "src/types/severa/user/severaResponseUser";

/**
 * Interface for a SeveraApiService.
 */
export interface SeveraApiService {
  getFlextimeBySeveraUserId: (severaUserId: string) => Promise<Flextime>;
  getResourceAllocation: (endpointPath: URL) => Promise<SeveraResponseResourceAllocation[]>;
  getPhasesBySeveraProjectId: (severaProjectId: string) => Promise<SeveraResponsePhases[]>;
  getWorkHours: (endpointPath: URL, startDate?: string, endDate?: string ) => Promise<SeveraResponseWorkHours[]>;  
  getPreviousWorkHours: () => Promise<SeveraResponsePreviousWorkHours[]>;
  getWorkDays: (severaUserId: string) => Promise<SeveraResponseWorkDays>;
  getOptInUsers: () => Promise<SeveraResponseUser[]>;
  getResourceAllocations: () => Promise<SeveraResponseResourceAllocation>;
  getUser: (severaUserId: string) => Promise<SeveraResponseUser>;
  getKeywordIdForUser: (severaUserId: string, keywordValue: string) => Promise<string>;
  getWorkWeek: (severaUserId: string) => Promise<SeveraResponseWorkDays[]>;
  getPreviousWeekHours: (severaUserId: string) => Promise<SeveraResponsePreviousWorkHours[]>;
  getFilteredWorkHoursForUsers: (users: { guid: string }[], severaProjectId: string, startDate?: string, endDate?: string) => Promise<SeveraResponseWorkHours[]>;
  getWorkHoursForUser: (severaUserId: string, startDate?: string, endDate?: string) => Promise<SeveraResponseWorkHours[]>;
  getResourceAllocationsByUserOrAll: (severaUserId: string | undefined, optInUsers: { guid: string }[]) => Promise<SeveraResponseResourceAllocation[]>;
  checkKeywordExists: (keyword: string) => Promise<KeywordModel>;
  fetchUserByEmail: (email: string) => Promise<UserOutputModel>;
  getUserKeywords: (userGuid: string) => Promise<UserKeywordModel[]>;
  updateSeveraOptInKeyword: (userGuid: string, isSeveraOptIn: string, isSeveraOptInKeywordGuid: string) => Promise<UserKeywordModel>;
}

/**
 * Creates SeveraApiService
 */
export const CreateSeveraApiService = (): SeveraApiService => {
  const baseUrl: string = process.env.SEVERA_DEMO_BASE_URL;
  return {
    /**
     * Gets flextime by severaUserId
     *
     * @param severaUserId  Severa user id
     * @returns Flextime of a user
     */
    getFlextimeBySeveraUserId: async (severaUserId: string) => {
      const eventDateYesterday = DateTime.now().minus({ days: 1 }).toISODate();

      const url = `${baseUrl}/v1/users/${severaUserId}/flextime?eventdate=${eventDateYesterday}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch flextime: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    },

    /**
     * Get resource allocation by userId
     *
     * @param severaUserId Severa user id
     * @returns Resource allocation of a user
     */
    getResourceAllocation: async (endpointPath: URL) => {
      const response = await fetch(`${endpointPath}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch resource allocation: ${response.status} - ${response.statusText}`
        );
      }
      return response.json();
    },

    /**
     * Gets phases by projectId
     *
     * @param severaProjectId Severa project id
     * @returns Phases of a project
     */
    getPhasesBySeveraProjectId: async (severaProjectId: string) => {
      const url: string = `${baseUrl}/v1/projects/${severaProjectId}/phaseswithhierarchy`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch phases: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    },

    /**
     * Gets work hours
     *
     * @param url custom url for fetching work hours depending on queryparameters requirements
     * @returns Work hours
     */
    getWorkHours: async (endpointPath: URL) => {
      const response = await fetch(`${endpointPath}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch work hours: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    },

    /**
     * Gets Workdays from Severa
     *
     * @param severaUserId Severa user id
     * @returns Workdays of a user
     */
    getWorkDays: async (severaUserId: string) => {
      const eventDateYesterday = TimeUtilities.getPreviousTwoWorkdays().yesterday.toISODate();
      const today = DateTime.now().toISODate();
      const isProduction = process.env.NODE_ENV === "production";
      const startDate = isProduction ? eventDateYesterday : "2024-11-26";
      const endDate = isProduction ? today : "2024-11-26";

      const url = `${baseUrl}/v1/users/${severaUserId}/workdays?startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch workdays: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    },

    /**
     * Gets Work week from Severa
     * 
     * @param severaUserId Severa user id
     * @returns Workdays of a user
     */
    getWorkWeek: async (severaUserId: string) => {

      const demoDataDate = process.env.DEMO_DATA_DATE;
      const today = demoDataDate ? DateTime.fromISO(demoDataDate).toISODate() : DateTime.now().toISODate();
      const weekAgo = demoDataDate ? DateTime.fromISO(demoDataDate).minus({ days: 7 }).toISODate() : DateTime.now().minus({ days: 7 }).toISODate();
      const startDate = weekAgo;
      const endDate = today;

      const url = `${baseUrl}/v1/users/${severaUserId}/workdays?startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch workdays: ${response.status} - ${response.statusText}`,
        );
      }
      return response.json();
    },

    /**
     * Gets resourceallocations from Severa
     */
    getResourceAllocations: async () => {
      const url = `${baseUrl}/v1/resourceallocations`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch resourceallocations: ${response.status} - ${response.statusText}`
        );
      }
      return response.json();
    },

    /**
     * Gets users from Severa
     */
    getOptInUsers: async () => {
      const optInKeywordId = "8e7b363e-aa8c-34b1-478f-0a9633848fde";
      const url = `${baseUrl}/v1/users?keywordGuids=${optInKeywordId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    },

    /**
     * Gets previous workdays Workhours from Severa
     */
    getPreviousWorkHours: async () => {
      const demoDataDate = process.env.DEMO_DATA_DATE;
      const startDate = demoDataDate ? DateTime.fromISO(demoDataDate).minus({ days: 1 }).toISODate() : TimeUtilities.getPreviousTwoWorkdays().yesterday.toISODate();
      const endDate = demoDataDate ? DateTime.fromISO(demoDataDate).toISODate() : DateTime.now().toISODate();
      
      const url = `${baseUrl}/v1/workhours?eventDateStart=${startDate}&eventDateEnd=${endDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch work hours: ${response.status} - ${response.statusText}`,
        );
      }
      return response.json();
    },

    /**
     * Gets previous workweeks Workhours from Severa
     *
     * @param severaUserId Severa user id
     * @returns Previous workweek workhours for the user
     */
    getPreviousWeekHours: async (severaUserId: string) => {
      const demoDataDate = process.env.DEMO_DATA_DATE;
      const today = demoDataDate ? DateTime.fromISO(demoDataDate).toISODate() : DateTime.now().toISODate();
      const weekAgo = demoDataDate ? DateTime.fromISO(demoDataDate).minus({ days: 7 }).toISODate() : DateTime.now().minus({ days: 7 }).toISODate();
      const startDate = weekAgo;
      const endDate = today;

      const url = `${baseUrl}/v1/users/${severaUserId}/workhours?eventDateStart=${startDate}&eventDateEnd=${endDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch work hours: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    },
    
    /**
   * Gets a specific user from Severa by their user ID.
   *
   * @param severaUserId - Severa user ID
   * @returns Severa user object, including keywords
   */
    getUser: async (severaUserId: string) => {
    const url = `${baseUrl}/v1/users/${severaUserId}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Severa user: ${response.status} - ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Gets the keyword ID for a given keyword name from a user's assigned keywords.
     *
     * @param severaUserId - Severa user ID
     * @param keywordValue - The text of the keyword (e.g. "isSeveraOptIn")
     * @returns GUID of the matched keyword
     */
    getKeywordIdForUser: async (severaUserId: string, keywordValue: string) => {
      const url = `${baseUrl}/v1/users/${severaUserId}/keywords`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch keywords for user: ${response.status} - ${response.statusText}`);
      }

      const keywords = await response.json();
      const match = keywords.find((k: { keyword: string }) => k.keyword === keywordValue);

      if (!match) {
        throw new Error(`Keyword "${keywordValue}" not found for user ${severaUserId}`);
      }

      return match.guid;
    },

    /**
     * Gets work hours for multiple users filtered by project and dates.
     *
     * @param users Array of users (must have .guid)
     * @param severaProjectId Project GUID
     * @param startDate Optional start date
     * @param endDate Optional end date
     * @returns Array of work hours for all users
     */
    getFilteredWorkHoursForUsers: async (
      users,
      severaProjectId,
      startDate,
      endDate
    ) => {
      const errors: Array<{ userGuid: string, error: any }> = [];
      const workHoursResults = await Promise.all(
        users.map(async (user) => {
          try {
            const url = new URL(`${baseUrl}/v1/users/${user.guid}/workhours`);
            // This endpoint/query parameter is working but it is not documented proper in Severa API spec
            url.searchParams.append("projectGuid", severaProjectId);
            if (startDate) url.searchParams.append("startDate", startDate);
            if (endDate) url.searchParams.append("endDate", endDate);
            const userWorkHours = await (await fetch(url.toString(), {
              method: "GET",
              headers: {
                Authorization: `Bearer ${await getSeveraAccessToken()}`,
                Client_Id: getSeveraClientId(),
                "Content-Type": "application/json"
              }
            })).json();
            return userWorkHours;
          } catch (e) {
            errors.push({ userGuid: user.guid, error: e });
            return [];
          }
        })
      );
      return workHoursResults.flat();
    },

    /**
     * Fetches work hours for a specific user from Severa API.
     *
     * @param severaUserId - The GUID of the Severa user whose work hours are being retrieved.
     * @param startDate - (Optional) The start date for filtering work hours (ISO format).
     * @param endDate - (Optional) The end date for filtering work hours (ISO format).
     * @returns {Promise<SeveraResponseWorkHours[]>} - A promise that resolves to an array of work hours for the specified user.
     * @throws {Error} If the request to the Severa API fails.
     */
    getWorkHoursForUser: async (severaUserId, startDate, endDate) => {
      const url = new URL(`${process.env.SEVERA_DEMO_BASE_URL}/v1/users/${severaUserId}/workhours`);
      if (startDate) url.searchParams.append("startDate", startDate);
      if (endDate) url.searchParams.append("endDate", endDate);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch work hours: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    },

    /**
     * Gets resource allocations for a specific user or for all opt-in users if no user is specified.
     *
     * @param severaUserId - The GUID of the Severa user (optional).
     * @param optInUsers - Array of opted-in users ({ guid: string }[]).
     * @returns {Promise<SeveraResponseResourceAllocation[]>} - Array of resource allocations.
     */
    getResourceAllocationsByUserOrAll: async (
      severaUserId: string | undefined,
      optInUsers: { guid: string }[]
    ): Promise<SeveraResponseResourceAllocation[]> => {
      const buildResourceAllocationUrl = (severaUserId?: string): URL | null => {
        let endpointPath: string;
        if (severaUserId) {
          endpointPath = `users/${severaUserId}/resourceallocations/allocations`;
          const customUrl = new URL(`${baseUrl}/v1/${endpointPath}`);
          return customUrl;
        } else {
          return null;
        }
      };

      const url = buildResourceAllocationUrl(severaUserId);
      let allResourceAllocations: SeveraResponseResourceAllocation[] = [];

      if (url) {
        const response = await (await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await getSeveraAccessToken()}`,
            Client_Id: getSeveraClientId(),
            "Content-Type": "application/json"
          }
        })).json();
        allResourceAllocations = response;
      } else {
        const resourceAllocationsResults = await Promise.all(
          optInUsers.map(async (user: { guid: string }) => {
            try {
              const userUrl = new URL(`${baseUrl}/v1/users/${user.guid}/resourceallocations/allocations`);
              const userResourceAllocations = await (await fetch(userUrl.toString(), {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${await getSeveraAccessToken()}`,
                  Client_Id: getSeveraClientId(),
                  "Content-Type": "application/json"
                }
              })).json();
              return userResourceAllocations;
            } catch (e) {
              console.error(`Error fetching resource allocations for user ${user.guid}:`, e);
              return [];
            }
          })
        );
        allResourceAllocations = resourceAllocationsResults.flat();
      }

      return allResourceAllocations;
    },

    /**
     * Checks if a keyword exists in Severa. If not, creates it.
     *
     * @param keyword The keyword to check or create.
     * @returns The existing or newly created keyword object.
     */
    checkKeywordExists: async (keyword: string) => {
      const KeywordsUrl = `${baseUrl}/v1/keywords?keyword=${keyword}`;
      const allKeywordsResponse = await fetch(KeywordsUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!allKeywordsResponse.ok) {
        throw new Error(
          `Failed to fetch keywords: ${allKeywordsResponse.status} - ${allKeywordsResponse.statusText}`
        );
      }

      const allKeywords = await allKeywordsResponse.json();
      const existingKeyword = allKeywords.find((kw: { keyword: string }) => kw.keyword === keyword);

      if (existingKeyword) {
        return existingKeyword;
      }

      const createKeywordUrl = `${baseUrl}/v1/keywords`;
      const createKeywordResponse = await fetch(createKeywordUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          keyword: "isSeveraOptIn",
          category: "User",
          isActive: true
        })
      });

      if (!createKeywordResponse.ok) {
        throw new Error(
          `Failed to create keyword '${keyword}': ${createKeywordResponse.status} - ${createKeywordResponse.statusText}`
        );
      }
      const newKeyword = await createKeywordResponse.json();

      return newKeyword;
    },

    /**
     * Fetches a Severa user by their email address.
     *
     * @param email The email address of the user to retrieve.
     * @returns The user object if found.
     */
    fetchUserByEmail: async (email: string) => {
      const url = `${baseUrl}/v1/users?email=${encodeURIComponent(email)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user by email: ${response.status} - ${response.statusText}`);
      }

      const users = await response.json();
      if (!users?.length) {
        throw new Error(`No user found with email: ${email}`);
      }

      return users[0];
    },

    /**
     * Retrieves the keywords associated with a Severa user.
     *
     * @param userGuid The GUID of the user whose keywords are being fetched.
     * @returns A list of keywords for the user.
     */
    getUserKeywords: async (userGuid: string) => {
      const userKeywordsUrl = `${baseUrl}/v1/users/${userGuid}/keywords`;
      const keywordsResponse = await fetch(userKeywordsUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        }
      });

      if (!keywordsResponse.ok) {
        throw new Error(
          `Failed to fetch keywords for user: ${keywordsResponse.status} - ${keywordsResponse.statusText}`
        );
      }

      return await keywordsResponse.json();
    },

    /**
     * Updates the 'isSeveraOptIn' keyword for a Severa user.
     *
     * @param userGuid The GUID of the user whose keyword is being updated.
     * @param isSeveraOptIn The new value for the 'isSeveraOptIn' keyword.
     * @param isSeveraOptInKeywordGuid The GUID of the 'isSeveraOptIn' keyword.
     * @returns The updated keyword response.
     */
    updateSeveraOptInKeyword: async (
      userGuid: string,
      isSeveraOptIn: string,
      isSeveraOptInKeywordGuid: string
    ) => {
      const updateKeywordUrl = `${baseUrl}/v1/users/${userGuid}/keywords/${isSeveraOptInKeywordGuid}`;
      const updateResponse = await fetch(updateKeywordUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: getSeveraClientId(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          value: isSeveraOptIn
        })
      });

      if (!updateResponse.ok) {
        throw new Error(
          `Failed to update Severa keyword for user: ${updateResponse.status} - ${updateResponse.statusText}`
        );
      }

      return await updateResponse.json();
    },

  };
};

/**
 * Gets Severa access token
 *
 * @returns Access token as string
 */
const getSeveraAccessToken = async (): Promise<string> => {
  const url: string = `${process.env.SEVERA_DEMO_BASE_URL}/v1/token`;
  const client_Id: string = getSeveraClientId();
  const client_Secret: string = process.env.SEVERA_DEMO_CLIENT_SECRET;

  const requestBody = {
    client_id: client_Id,
    client_secret: client_Secret,
    scope:
      "projects:read, resourceallocations:read, hours:read, users:read, users:write, settings:write, settings:read"
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get Severa access token: ${response.status} - ${response.statusText}`
      );
    }
    const data = await response.json();

    return data.access_token;
  } catch (error) {
    throw new Error(`Failed to get Severa access token: ${error.message}`);
  }
};

// Utility function to get correct Severa client ID based on environment
const getSeveraClientId = (): string => {
  return process.env.NODE_ENV === "production"
    ? process.env.SEVERA_CLIENT_ID
    : process.env.SEVERA_DEMO_CLIENT_ID;
};
