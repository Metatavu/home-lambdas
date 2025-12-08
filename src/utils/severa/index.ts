
import Config from "src/app/config";
import {CreateSeveraApiService} from "src/services/severa-api-service";

/**
 * Fetches a Severa user by their Keycloak id and checks/updates the 'isSeveraOptIn' status.
 *
 * @param keycloakUserId The Keycloak id of the user to be retrieved.
 * @param keyword Keywords to be checked/updated for the user.
 *
 * @returns The user's Severa GUID, 'isSeveraOptIn' status, and email.
 */
export const optInSeveraUser = async (keycloakUserId: string, keyword: Record<string, string[]>) => {
  const userEmailFallback = Config.get().testUser.email;

  try {
    const api = CreateSeveraApiService();
    const user = await api.fetchUserByKeycloakId(keycloakUserId);
    const userEmail = (user && (user.email ?? userEmailFallback));
    const isSeveraOptIn = keyword.isSeveraOptIn?.[0];
    const isSeveraOptInKeyword = await api.checkKeywordExists("isSeveraOptIn");

    if (!isSeveraOptInKeyword?.guid) {
      throw new Error("No 'isSeveraOptIn' keyword found.");
    }

    const keywords = await api.getUserKeywords(user.guid);
    const existingKeywordForUser = keywords.find(
      (kw: { keyword: string }) => kw.keyword === "isSeveraOptIn"
    );

    if (!existingKeywordForUser) {
      const updatedKeyword = await api.updateSeveraOptInKeyword(
        user.guid,
        isSeveraOptIn,
        isSeveraOptInKeyword.guid
      );
      return {
        guid: user.guid,
        isSeveraOptIn: updatedKeyword.keyword,
        email: userEmail
      };
    }
    return {
      guid: user.guid,
      isSeveraOptIn: existingKeywordForUser.keyword,
      email: userEmail
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while processing the user request.";
        throw new Error(`Error while updating severa opt in: ${errorMessage}`);
  }
};
