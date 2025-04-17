import Config from "src/app/config";
import { fetchUserByEmail, getUserKeywords, checkKeywordExists, updateSeveraOptInKeyword } from "src/services/severa-api-service";
export const optInSeveraUser = async (email, keyword) => {
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
        const existingKeywordForUser = keywords.find((kw) => kw.keyword === "isSeveraOptIn");
        if (!existingKeywordForUser) {
            const updatedKeyword = await updateSeveraOptInKeyword(user.guid, isSeveraOptIn, isSeveraOptInKeyword.guid);
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
    }
    catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : "An unknown error occurred while processing the user request.";
        throw new Error(`Error while updating severa opt in: ${errorMessage}`);
    }
};
//# sourceMappingURL=index.js.map