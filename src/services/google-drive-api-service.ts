import { google } from "googleapis";
import { File, PdfFile } from "../schema/google";
import { Readable } from "stream";
import {streamToBuffer} from "../libs/file-utils";

const folderId = process.env.GOOGLE_MANAGEMENT_MINUTES_FOLDER_ID;

/**
 * Google authentication service
 *
 * @returns Google Authentication 
 */
export const getGoogleAuth = async () => {
  try {
    return new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      keyId: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      scopes: [
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/cloud-translation"
      ],
    });
  } catch (error) {
    console.error("Error initializing Google Authentication:", error);
  }
}

/**
 * Gets Google Authentication and Drive service
 *
 * @returns Google Drive 
 */
export const getDriveService = async () => {
  const auth = await getGoogleAuth();
  return google.drive({ version: "v3", auth });
}

/**
 * Retrieves metadata for a specified file ID
 * 
 * @param id file ID
 * @returns file's metadata
 */
export const getFile = async (id: string): Promise<File | undefined> => {
  try {
    const drive = await getDriveService();
    const file = (await drive.files.get({
      fileId: id,
      fields: "id, name, mimeType",
    }))?.data;
    return file;
  } catch (error) {
    console.error(`Error retrieving file with ID: ${id}`, error);
  }
}

/**
 * Retrieves a list of files from the base folder
 * 
 * @returns array of File objects
 */ 
export const getBaseFolderFiles = async (): Promise<File[]> => {
  try {
    const drive = await getDriveService();
    const files: File[] = (await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.document'`,
      fields: 'files(id, name, mimeType)'
    })).data?.files;
    return files;
  } catch (error) {
    console.error("Error retrieving base folder files:", error);
  }
}

/**
 * Gets Google Drive folder ID for in a specific folder
 *
 * @param folderId base folder id
 * @returns folder ID of found folder
 */
const getFolders = async (folderId: string) => {
  try {
    const drive = await getDriveService();
    const folderIds = (await drive.files.list({
      q: `"${folderId}" in parents and mimeType = "application/vnd.google-apps.folder"`,
      fields: "files(id, name, mimeType)"
    })).data?.files;
    return folderIds;
  } catch (error) {
    console.error(`Error retrieving folder IDs: ${error}`)
  }
}

/**
 * Gets Google Drive folder ID for in a base folder by name
 *
 * @param folderName folder name
 * @returns folder ID of found folder
 */
export const getBaseFolderByName = async (folderName: string) => {
  try {
    const folders = await getFolders(folderId);
    const folderFound = folders.find(folder => folder.name === folderName);
    return folderFound.id;
  } catch(error) {
    console.error(`Error retrieving folder ID: ${error}`)
  }
}

/**
 * Retrieves a list of files from a specified year folder
 *
 * @param year year
 * @param mimeType type of file, PDF format by default
 * @returns array of File objects
 */
export const getFilesInYear = async (year: string, mimeType: string = "application/pdf"): Promise<File[]> => {
  try {
    const drive = await getDriveService();
    const yearFolder = await getBaseFolderByName(year);
    if (yearFolder) {
      const monthFolders = await getFolders(yearFolder);
      const allFiles: File[] = (await Promise.all(
        monthFolders.map(async (month) => {
          const files: File[] = (await drive.files.list({
            q: `'${month.id}' in parents and mimeType = '${mimeType}'`,
            fields: "files(id, name, mimeType)"
          })).data?.files;
          return files;
      }))).flat();
      return allFiles;
    }
    return [];
  } catch (error) {
    console.error(`Error retrieving files for year: ${year}`, error);
  }
}

/**
 * Retrieves a list of summary files from a specified summary folder
 *
 * @returns array of File objects
 */
export const getFileSummaries = async (): Promise<File[]> => {
  try {
    const drive = await getDriveService();
    const summariesFolder = await getBaseFolderByName("summaries");
    const summaries: File[] = (await drive.files.list({
      q: `"${summariesFolder}" in parents and mimeType = "application/vnd.google-apps.document"`,
      fields: "files(id, name, mimeType)"
    })).data?.files;
    return summaries;
  } catch(error) {
    console.error(`Error retrieving summaries files: ${error}`)
  } 
}

/**
 * Retrieves a list of translated files from a specified translated folder
 *
 * @returns array of File objects
 */
export const getFileTranslated = async (): Promise<File[]> => {
  try {
    const drive = await getDriveService();
    const trnslatedFolder = await getBaseFolderByName("translated");
    const translatedFiles: File[] = (await drive.files.list({
      q: `"${trnslatedFolder}" in parents and mimeType = "application/pdf"`,
      fields: "files(id, name, mimeType)"
    })).data?.files;
    return translatedFiles;
  } catch(error) {
    console.error(`Error retrieving summaries files: ${error}`)
  } 
}


/**
 * Gets Google Drive folder ID for a specified year and month, organized under a main root folder
 *
 * @param year year
 * @param month month
 * @returns folder ID of month folder
 */
export const getFolderId = async (year: string, month: string): Promise<string> => {
  try {
    const drive = await getDriveService();

    const yearFolderId = (await drive.files.list({
      q: `"${folderId}" in parents and name = "${year}" and mimeType = "application/vnd.google-apps.folder"`,
      fields: "files(id)"
    })).data?.files[0]?.id;
    if (!yearFolderId) {
      console.error(`Year folder not found for year: ${year}`);
      return null;
    }

    const monthFolderId = (await drive.files.list({
      q: `"${yearFolderId}" in parents and name = "${month}" and mimeType = "application/vnd.google-apps.folder"`,
      fields: "files(id)"
    })).data?.files[0]?.id;
    if (!monthFolderId) {
      console.error(`Month folder not found for year: ${year}, month: ${month}`);
      return null;
    }
    return monthFolderId;
  } catch (error) {
    console.error(`Error retrieving folder ID for year: ${year}, month: ${month}`, error);
    return null;
  }
}

/**
 * Gets text content of a specified file in plain text format
 * 
 * @param file File metadata
 * @returns file's content
 */
export const getFileText = async (file: File): Promise<string> => {
  try {
    const drive = await getDriveService();
    const text = (await drive.files.export({
      fileId: file.id,
      mimeType: "text/plain"
    })).data;
    return text as string;
  } catch (error) {
    console.error(`Error retrieving text content of file: ${file.id}`, error);
  }
}

/**
 * Retrieves the binary content of a single PDF file 
 * 
 * @param file File object
 * @param usedDrive Drive Instance
 * @returns PDF file objects
 */
export const getFileContentPdf = async (file: File): Promise<PdfFile> => {
  const drive = await getDriveService();
  try {
    const response = await drive.files.get({
      fileId: file.id,
      alt: "media",
    },
    { responseType: "stream"}
    )
    if (!response) {
      console.error(`Failed to fetch file content: ${response.status} - ${response.statusText}`);
    }
    const pdfBuffer = await streamToBuffer(response.data);
    return {
      id: file.id,
      name: file.name,
      content: pdfBuffer
    }
  } catch (error) {
    console.error("Error loading the PDF:", error);
  }
}

/**
 * Creates a new PDF file from binary content and stores it in a specified folder
 * 
 * @param pdfFile PDF file object
 * @param folderId folder ID
 * @returns ID of files
 */
export const createPdfFile = async (pdfFile: PdfFile, folderId: string) => {
  try {
    const drive = await getDriveService();
    const response = await drive.files.create({
      requestBody: {
        name: pdfFile.name,
        mimeType: "application/pdf",
        parents: [folderId]
      },
      media: {
        mimeType: "application/pdf",
        body: Readable.from(pdfFile.content)
      }
    });
    return response.data.id;
  } catch (error) {
    console.error(`Failed to create PDF file: ${pdfFile.name} in folder ID: ${folderId}`, error);
  }
}