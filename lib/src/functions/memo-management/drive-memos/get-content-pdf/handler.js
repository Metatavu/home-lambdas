import { middyfy } from "src/libs/lambda";
import { getFileContentPdf } from "src/services/google-drive-api-service";
const getContentPdfHandler = async (event) => {
    const fileId = event.queryStringParameters?.fileId;
    if (!fileId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameter: id" }),
        };
    }
    try {
        const fileContent = await getFileContentPdf({ id: fileId });
        if (!fileContent?.content) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "File not found" }),
            };
        }
        const base64Content = fileContent.content.toString("base64");
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=${fileContent.name}`,
            },
            body: base64Content,
            isBase64Encoded: true,
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
        };
    }
};
export const main = middyfy(getContentPdfHandler);
//# sourceMappingURL=handler.js.map