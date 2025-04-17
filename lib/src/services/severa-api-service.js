import fetch from "node-fetch";
import { DateTime } from "luxon";
import TimeUtilities from "src/meta-assistant/generic/time-utils";
export const CreateSeveraApiService = () => {
    const baseUrl = process.env.SEVERA_DEMO_BASE_URL;
    return {
        getFlextimeBySeveraUserId: async (severaUserId) => {
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
        getResourceAllocation: async (endpointPath) => {
            const response = await fetch(`${endpointPath}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${await getSeveraAccessToken()}`,
                    Client_Id: process.env.SEVERA_DEMO_CLIENT_ID,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch resource allocation: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        },
        getPhasesBySeveraProjectId: async (severaProjectId) => {
            const url = `${baseUrl}/v1/projects/${severaProjectId}/phaseswithhierarchy`;
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
        getWorkHours: async (endpointPath) => {
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
        getWorkDays: async (severaUserId) => {
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
                throw new Error(`Failed to fetch resourceallocations: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        },
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
const getSeveraAccessToken = async () => {
    const url = `${process.env.SEVERA_DEMO_BASE_URL}/v1/token`;
    const client_Id = process.env.SEVERA_DEMO_CLIENT_ID;
    const client_Secret = process.env.SEVERA_DEMO_CLIENT_SECRET;
    const requestBody = {
        client_id: client_Id,
        client_secret: client_Secret,
        scope: "projects:read, resourceallocations:read, hours:read, users:read, users:write, settings:write, settings:read"
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
            throw new Error(`Failed to get Severa access token: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        return data.access_token;
    }
    catch (error) {
        throw new Error(`Failed to get Severa access token: ${error.message}`);
    }
};
export const checkKeywordExists = async (keyword) => {
    const baseUrl = process.env.SEVERA_DEMO_BASE_URL;
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
        throw new Error(`Failed to fetch keywords: ${allKeywordsResponse.status} - ${allKeywordsResponse.statusText}`);
    }
    const allKeywords = await allKeywordsResponse.json();
    const existingKeyword = allKeywords.find((kw) => kw.keyword === keyword);
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
        throw new Error(`Failed to create keyword '${keyword}': ${createKeywordResponse.status} - ${createKeywordResponse.statusText}`);
    }
    const newKeyword = await createKeywordResponse.json();
    return newKeyword;
};
export const fetchUserByEmail = async (email) => {
    const baseUrl = process.env.SEVERA_DEMO_BASE_URL;
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
export const getUserKeywords = async (userGuid) => {
    const baseUrl = process.env.SEVERA_DEMO_BASE_URL;
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
        throw new Error(`Failed to fetch keywords for user: ${keywordsResponse.status} - ${keywordsResponse.statusText}`);
    }
    return await keywordsResponse.json();
};
export const updateSeveraOptInKeyword = async (userGuid, isSeveraOptIn, isSeveraOptInKeywordGuid) => {
    const baseUrl = process.env.SEVERA_DEMO_BASE_URL;
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
        throw new Error(`Failed to update Severa keyword for user: ${updateResponse.status} - ${updateResponse.statusText}`);
    }
    return await updateResponse.json();
};
//# sourceMappingURL=severa-api-service.js.map