import Config from "src/app/config";
import {
  fetchUserByEmail,
  getUserKeywords,
  checkKeywordExists,
  updateSeveraOptInKeyword,
  removeUserKeyword
} from "src/services/severa-api-service";
/**
 * Fetches a Severa user by their email address and checks/updates the 'isSeveraOptIn' status.
 *
 * @param email The email address of the user to be retrieved.
 * @param keyword Keywords to be checked/updated for the user.
 *
 * @returns The user's Severa GUID, 'isSeveraOptIn' status, and email.
 */
export const optInSeveraUser = async (email: string, keyword: Record<string, string[]>) => {
  const isLocal = process.env.STAGE === "local" || !process.env.STAGE;

  const userEmail = isLocal ? Config.get().testUser.email : email;

  try {
    const user = await fetchUserByEmail(userEmail);
    const isSeveraOptIn = keyword.isSeveraOptIn?.[0];
    const isSeveraOptInKeyword = await checkKeywordExists("isSeveraOptIn");

    if (!isSeveraOptInKeyword?.guid) {
      throw new Error("No 'isSeveraOptIn' keyword found.");
    }

    const keywords = await getUserKeywords(user.guid);
    const existingKeywordForUser = keywords.find(
      (kw: { keyword: string }) => kw.keyword === "isSeveraOptIn"
    );

    if (keyword.removeUser) {
      if (!user.guid || !isSeveraOptInKeyword.guid) {
        throw new Error("Invalid GUID: userGuid or keywordGuid is missing.");
      }

      await removeUserKeyword(user.guid, isSeveraOptInKeyword.guid);
      return {
        guid: user.guid,
        isSeveraOptIn: null,
        email: userEmail,
        message: `Keyword 'isSeveraOptIn' removed from user ${user.guid}`
      };
    }
    if (!existingKeywordForUser) {
      const updatedKeyword = await updateSeveraOptInKeyword(
        user.guid,
        isSeveraOptIn,
        isSeveraOptInKeyword.guid
      );
      return {
        guid: user.guid,
        isSeveraOptIn: updatedKeyword.value,
        email: userEmail
      };
    }
    return {
      guid: user.guid,
      isSeveraOptIn: existingKeywordForUser.value,
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
