import { google } from "googleapis";
import { getDriveService, getGoogleAuth } from "./google-drive-api-service";
const getDocsService = async () => {
    const auth = await getGoogleAuth();
    return google.docs({ version: "v1", auth });
};
export const createDocSummary = async (text, folderId, file) => {
    try {
        const docs = await getDocsService();
        const drive = await getDriveService();
        const docResponse = await docs.documents.create({
            requestBody: { title: `summary_${file.name}` },
        });
        const documentId = docResponse.data.documentId;
        await drive.files.update({
            fileId: documentId,
            addParents: folderId,
            removeParents: "",
            fields: "id, parents",
        });
        await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: { index: 1 },
                            text: text,
                        },
                    },
                ],
            },
        });
    }
    catch (error) {
        console.error(`Error creating document summary for file: ${file.id}`, error);
    }
};
//# sourceMappingURL=google-docs-api-service.js.map