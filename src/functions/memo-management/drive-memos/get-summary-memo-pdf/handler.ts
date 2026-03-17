import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getBaseFolderByName, getBaseFolderFiles, getFile, getFileSummaries, getFileText } from "src/services/google-drive-api-service";
import { middyfy } from "src/libs/lambda";
import SlackUtilities from "src/meta-assistant/slack/slack-utils";
import { generateSummary } from "src/services/open-api-service";
import { createDocSummary } from "src/services/google-docs-api-service";

/**
 * Generates summary based on memo's content
 * 
 * @param date date
 * @param fileId ID of file
 * @returns generated summary text
 */
const getSummaryMemoPdf = async (fileId: string) => {
  const file = await getFile(fileId);
  if (!file) return;

  const fileSummary = (await getFileSummaries()).find(fileInFolder => `summary_${file.name}`.includes(fileInFolder.name));
  if (fileSummary) {
    const text = await getFileText(fileSummary);
    return text;
  }
  
  const filesInBaseFolder = await getBaseFolderFiles();
  const folderId = await getBaseFolderByName("summaries");
  const fileToGenerateSummary = filesInBaseFolder.find(fileInBaseFolder => file.name.includes(fileInBaseFolder.name));
  const summaryText = await generateSummary(fileToGenerateSummary);

  await SlackUtilities.postSummaryToChannel(summaryText, file.name);
  await createDocSummary(summaryText, folderId, fileToGenerateSummary);
  return summaryText;
}

/**
 * Lambda for generating memos summary
 * 
 * @param event event
 */
const getSummaryMemoPdfHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const {queryStringParameters} = event;

  if (!queryStringParameters && !queryStringParameters?.fileId) {
    return  {
      statusCode: 400,
      body: "Missing parameters"
    };
  }
  try {
    const summaryText =  await getSummaryMemoPdf(queryStringParameters.fileId);
    const paragraphSeparator = "|";
    const splittedText = summaryText.split(paragraphSeparator);
    if (summaryText) 
      return {
        statusCode: 200,
        body: JSON.stringify({en: splittedText[0], fi: splittedText[1]})
      }
    return {
      statusCode: 404,
      body: "File not found"
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate summary", details: error.message }),
    };
  }
};

export const main = middyfy(getSummaryMemoPdfHandler);