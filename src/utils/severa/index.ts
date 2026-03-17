
import Config from "src/app/config";
import {CreateSeveraApiService} from "src/services/severa-api-service";

/**
 * Fetches a Severa user by their email address and checks/updates the 'isSeveraOptIn' status.
 *
 * @param keycloakEmail The Keycloak user's email address.
 *
 * @returns The email to user for Severa lookup
 */
export const getLookupEmail = (keycloakEmail: string): string | undefined => {
  return Config.get().testUser?.email ?? keycloakEmail;
};

export const optInSeveraUser = async (email: string, keyword: Record<string, string[]>) => {
  const userEmail = getLookupEmail(email);

  try {
    const api = CreateSeveraApiService();
    const user = await api.fetchUserByEmail(userEmail);
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
