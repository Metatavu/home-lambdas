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
  getWorkHours: (endpointPath: URL, startDate?: string, endDate?: string) => Promise<SeveraResponseWorkHours[]>;
  getPreviousWorkHours: () => Promise<SeveraResponsePreviousWorkHours[]>;
  getWorkDays: (severaUserId: string) => Promise<SeveraResponseWorkDays>;
  getOptInUsers: () => Promise<SeveraResponseUser[]>;
  getResourceAllocations: () => Promise<SeveraResponseResourceAllocation>;
  getUserByEmail: (email: string, attribute: Record<string, string[]>) => Promise<{ guid: string; isSeveraOptIn: boolean }> ;
  getTestUser:()  => Promise<{ guid: string }>
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
      Promise<{ guid: string }>
      const url = `${baseUrl}/v1/users/${severaUserId}/flextime?eventdate=${eventDateYesterday}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getSeveraAccessToken()}`,
          "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch flextime: ${response.status} - ${response.statusText}`,
        );
      }
      return response.json();
    },
      
    getTestUser : async ()  => {
      try {
        if (!process.env.SEVERA_TEST_USER_EMAIL) {
          throw new Error("SEVERA_TEST_USER_EMAIL environment variable is missing.");
        }
    
        return {
          guid: process.env.SEVERA_TEST_USER_EMAIL, 
          isSeveraOptIn: ["true"],  
        };
      } catch (error) {
        console.error("Error in getTestUser:", error);
        throw error;
      }
    },

    /**
     *  Get severa user email
     * 
     * @param email severa email
     * @returns email
     */
    getUserByEmail: async (email: string, attribute: Record<string, string[]>) => {
      try {
        const url = `${baseUrl}/v1/users?email=${encodeURIComponent(email)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await getSeveraAccessToken()}`,
            "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
            "Content-Type": "application/json",
          },
        });
    
        if (!response.ok) {
          const errorDetails = await response.text();
          console.error(`Failed to fetch user by email: ${response.status} - ${response.statusText}`);
          console.error("Error details:", errorDetails);
          throw new Error(`Failed to fetch user by email: ${response.status} - ${response.statusText}`);
        }
    
        const users = await response.json();
        if (!users || users.length === 0) {
          throw new Error(`No user found with email: ${email}`);
        }
    
        const user = users[0];
        console.log("Found Severa user:", user);
    
        
        const isSeveraOptIn = attribute.isSeveraOptIn?.[0] === "true"; 

        const keywordsUrl = `${baseUrl}/v1/users/${user.guid}/keywords`;
        const keywordsResponse = await fetch(keywordsUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await getSeveraAccessToken()}`,
            "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
            "Content-Type": "application/json",
          },
        });
    
        if (!keywordsResponse.ok) {
          const errorDetails = await keywordsResponse.text();
          console.error(`Failed to fetch keywords: ${keywordsResponse.status} - ${keywordsResponse.statusText}`);
          console.error("Error details:", errorDetails);
          throw new Error(`Failed to fetch keywords: ${keywordsResponse.status} - ${keywordsResponse.statusText}`);
        }
    
        const keywords = await keywordsResponse.json();
        const isSeveraOptInKeyword = keywords.find((kw: { name: string }) => kw.name === "isSeveraOptIn");
    
        if (!isSeveraOptInKeyword) {
          console.log("Keyword 'isSeveraOptIn' not found, creating new keyword...");
          throw new Error("Keyword 'isSeveraOptIn' not found. Manual addition required.");
        }
    
        const keywordGuid = isSeveraOptInKeyword.guid;
    
        const updateKeywordUrl = `${baseUrl}/v1/users/${user.guid}/keywords/${keywordGuid}`;
        const updateResponse = await fetch(updateKeywordUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await getSeveraAccessToken()}`,
            "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: isSeveraOptIn ? "true" : "false",
          }),
        });
    
        if (!updateResponse.ok) {
          const errorDetails = await updateResponse.text();
          console.error(`Failed to update Severa keyword: ${updateResponse.status} - ${updateResponse.statusText}`);
          console.error("Error details:", errorDetails);
          throw new Error(`Failed to update Severa keyword: ${updateResponse.status} - ${updateResponse.statusText}`);
        }
    
        console.log(`Updated keyword 'isSeveraOptIn' successfully for user ${user.guid}`);
    

        return {
          guid: user.guid,
          isSeveraOptIn, 
        };
    
      } catch (error) {
        console.error("Error in getUserByEmailAndUpdate:", error);
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred.");
      }
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
            "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch resource allocation: ${response.status} - ${response.statusText}`,
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
          "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch phases: ${response.status} - ${response.statusText}`,
        );
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
          "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
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
          "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
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
          "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch resourceallocations: ${response.status} - ${response.statusText}`,
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
          "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
          "Content-Type": "application/json",
        },
      });
    
      if (!response.ok) {
        throw new Error(
          `Failed to fetch users: ${response.status} - ${response.statusText}`,
        );
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
          "Client_Id": process.env.SEVERA_DEMO_CLIENT_ID,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch work hours: ${response.status} - ${response.statusText}`,
        );
      }
      return response.json();
  }};
}

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
    scope: "projects:read, resourceallocations:read, hours:read, users:read, users:write",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get Severa access token: ${response.status} - ${response.statusText}`,
      );
    }
    const data = await response.json();

    return data.access_token;
  } catch (error) {
    throw new Error(`Failed to get Severa access token: ${error.message}`);
  }
};
