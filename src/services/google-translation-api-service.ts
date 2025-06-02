import { PdfFile } from "src/schema/google";
import { getGoogleAuth } from "./google-drive-api-service";
import fetch from "node-fetch";

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

/**
 * Translates PDF content to Fi/En
 * 
 * @param pdfFile PDF file object
 * @returns PDF with translated content
 */
export const getTranslatedPdf = async (pdfFile: PdfFile): Promise<PdfFile> => {
  try {
    const accessToken = (await (await getGoogleAuth()).authorize()).access_token;
    const content = pdfFile.content.toString("base64");
    const translatedFileName = `translated_${pdfFile.name}`;
    const url = `https://translation.googleapis.com/v3/projects/${projectId}/locations/us-central1:translateDocument`;

    const detectFileLanguage = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        target_language_code: "fi",
        document_input_config: {
          mimeType: "application/pdf",
          content: content
        }
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const result = await detectFileLanguage.json();
    const detectedLanguage = result.documentTranslation.detectedLanguageCode;
    if (detectedLanguage == "en") {
      const translatedContent = result.documentTranslation.byteStreamOutputs[0];
      const bufferData = Buffer.from(translatedContent, "base64");
      return { id: "", name: translatedFileName, content: bufferData };
    }
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        source_language_code: "fi",
        target_language_code: "en",
        document_input_config: {
          mimeType: "application/pdf",
          content: content
        }
      }),
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const responseJs = await response.json();
    const translatedContent = responseJs.documentTranslation.byteStreamOutputs[0];
    const bufferData = Buffer.from(translatedContent, "base64");
    return {
      name: translatedFileName,
      content: bufferData
    };
  } catch (error) {
    console.error(`Failed to translate PDF content for file: ${pdfFile.name}`, error);
  }
}