import fetch from "node-fetch";
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
  getFlextimeBySeveraUserId: (severaUserId: string, eventDate: string) => Promise<Flextime>;
  getResourceAllocation: (endpointPath: URL) => Promise<SeveraResponseResourceAllocation[]>;
  getPhasesBySeveraProjectId: (severaProjectId: string) => Promise<SeveraResponsePhases[]>;
  getWorkHours: (endpointPath: URL, startDate?: string, endDate?: string ) => Promise<SeveraResponseWorkHours[]>;  
  getPreviousWorkHours: () => Promise<SeveraResponsePreviousWorkHours[]>;
  getWorkDays: (severaUserId: string) => Promise<SeveraResponseWorkDays>;
  getOptInUsers: () => Promise<SeveraResponseUser[]>;
  getResourceAllocations: () => Promise<SeveraResponseResourceAllocation>;
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
          Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
          Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
          Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
          Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
          Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch workdays: ${response.status} - ${response.statusText}`);
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
          Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
          Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
      const eventDateYesterday = TimeUtilities.getPreviousTwoWorkdays().yesterday.toISODate();
      const today = DateTime.now().toISODate();
      const isProduction = process.env.NODE_ENV === "production";
      const startDate = isProduction ? eventDateYesterday : "2024-11-26";
      const endDate = isProduction ? today : "2024-11-26";

      const url = `${baseUrl}/v1/workhours?eventDateStart=${startDate}&eventDateEnd=${endDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch work hours: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    }
  };
};

/**
 * Gets Severa access token
 *
 * @returns Access token as string
 */
const getSeveraAccessToken = async (): Promise<string> => {
  const url: string = `${process.env.SEVERA_DEMO_BASE_URL}/v1/token`;
  const client_Id: string = process.env.SEVERA_DEMO_CLIENT_ID;
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

/**
 * Checks if a keyword exists in Severa. If not, creates it.
 *
 * @param keyword The keyword to check or create.
 * @returns The existing or newly created keyword object.
 */
export const checkKeywordExists = async (keyword: string) => {
  const baseUrl: string = process.env.SEVERA_DEMO_BASE_URL;
  const KeywordsUrl = `${baseUrl}/v1/keywords?keyword=${keyword}`;

  const allKeywordsResponse = await fetch(KeywordsUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getSeveraAccessToken()}`,
      Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
      Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
};

/**
 * Fetches a Severa user by their email address.
 *
 * @param email The email address of the user to retrieve.
 * @returns The user object if found.
 */
export const fetchUserByEmail = async (email: string) => {
  const baseUrl: string = process.env.SEVERA_DEMO_BASE_URL;
  const url = `${baseUrl}/v1/users?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getSeveraAccessToken()}`,
      Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
};

/**
 * Retrieves the keywords associated with a Severa user.
 *
 * @param userGuid The GUID of the user whose keywords are being fetched.
 * @returns A list of keywords for the user.
 */
export const getUserKeywords = async (userGuid: string) => {
  const baseUrl: string = process.env.SEVERA_DEMO_BASE_URL;
  const userKeywordsUrl = `${baseUrl}/v1/users/${userGuid}/keywords`;
  const keywordsResponse = await fetch(userKeywordsUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getSeveraAccessToken()}`,
      Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
      "Content-Type": "application/json"
    }
  });

  if (!keywordsResponse.ok) {
    throw new Error(
      `Failed to fetch keywords for user: ${keywordsResponse.status} - ${keywordsResponse.statusText}`
    );
  }

  return await keywordsResponse.json();
};

/**
 * Updates the 'isSeveraOptIn' keyword for a Severa user.
 *
 * @param userGuid The GUID of the user whose keyword is being updated.
 * @param isSeveraOptIn The new value for the 'isSeveraOptIn' keyword.
 * @param isSeveraOptInKeywordGuid The GUID of the 'isSeveraOptIn' keyword.
 * @returns The updated keyword response.
 */
export const updateSeveraOptInKeyword = async (
  userGuid: string,
  isSeveraOptIn: string,
  isSeveraOptInKeywordGuid: string
) => {
  const baseUrl: string = process.env.SEVERA_DEMO_BASE_URL;
  const updateKeywordUrl = `${baseUrl}/v1/users/${userGuid}/keywords/${isSeveraOptInKeywordGuid}`;
  const updateResponse = await fetch(updateKeywordUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getSeveraAccessToken()}`,
      Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
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
};
