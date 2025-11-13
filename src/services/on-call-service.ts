import fetch from "node-fetch";
import Config from "src/app/config";

/**
 * Fetches the email address of a VictorOps user by their username.
 *
 * @param username - The VictorOps username to look up.
 * @returns A promise that resolves to the user's email address if found, or `null` if not found or an error occurs.
 */
export const getUserEmail = async (username: string): Promise<string | null> => {
  try {
    const { apiId, apiKey, userOnCallUrl } = Config.get().splunkApi;
    const response = await fetch(`${userOnCallUrl}/${username}`, {
      method: "GET",
      headers: {
        "X-VO-Api-Id": apiId,
        "X-VO-Api-Key": apiKey,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error(`VictorOps API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data?.email || null;
  } catch (error) {
    console.error("Error fetching VictorOps user email:", error);
    return null;
  }
};
