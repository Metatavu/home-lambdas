import { google } from "googleapis";
import { Readable } from "stream";
import { streamToBuffer } from "../libs/file-utils";
const folderId = process.env.GOOGLE_MANAGEMENT_MINUTES_FOLDER_ID;
export const getGoogleAuth = async () => {
    try {
        return new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
            keyId: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
            key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
            scopes: [
                "https://www.googleapis.com/auth/documents",
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/cloud-translation"
            ],
        });
    }
    catch (error) {
        console.error("Error initializing Google Authentication:", error);
    }
};
export const getDriveService = async () => {
    const auth = await getGoogleAuth();
    return google.drive({ version: "v3", auth });
};
export const getFile = async (id) => {
    try {
        const drive = await getDriveService();
        const file = (await drive.files.get({
            fileId: id,
            fields: "id, name, mimeType",
        }))?.data;
        return file;
    }
    catch (error) {
        console.error(`Error retrieving file with ID: ${id}`, error);
    }
};
export const getBaseFolderFiles = async () => {
    try {
        const drive = await getDriveService();
        const files = (await drive.files.list({
            q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.document'`,
            fields: 'files(id, name, mimeType)'
        })).data?.files;
        return files;
    }
    catch (error) {
        console.error("Error retrieving base folder files:", error);
    }
};
const getFolders = async (folderId) => {
    try {
        const drive = await getDriveService();
        const folderIds = (await drive.files.list({
            q: `"${folderId}" in parents and mimeType = "application/vnd.google-apps.folder"`,
            fields: "files(id, name, mimeType)"
        })).data?.files;
        return folderIds;
    }
    catch (error) {
        console.error(`Error retrieving folder IDs: ${error}`);
    }
};
export const getBaseFolderByName = async (folderName) => {
    try {
        const folders = await getFolders(folderId);
        const folderFound = folders.find(folder => folder.name === folderName);
        return folderFound.id;
    }
    catch (error) {
        console.error(`Error retrieving folder ID: ${error}`);
    }
};
export const getFilesInYear = async (year, mimeType = "application/pdf") => {
    try {
        const drive = await getDriveService();
        const yearFolder = await getBaseFolderByName(year);
        if (yearFolder) {
            const monthFolders = await getFolders(yearFolder);
            const allFiles = (await Promise.all(monthFolders.map(async (month) => {
                const files = (await drive.files.list({
                    q: `'${month.id}' in parents and mimeType = '${mimeType}'`,
                    fields: "files(id, name, mimeType)"
                })).data?.files;
                return files;
            }))).flat();
            return allFiles;
        }
        return [];
    }
    catch (error) {
        console.error(`Error retrieving files for year: ${year}`, error);
    }
};
export const getFileSummaries = async () => {
    try {
        const drive = await getDriveService();
        const summariesFolder = await getBaseFolderByName("summaries");
        const summaries = (await drive.files.list({
            q: `"${summariesFolder}" in parents and mimeType = "application/vnd.google-apps.document"`,
            fields: "files(id, name, mimeType)"
        })).data?.files;
        return summaries;
    }
    catch (error) {
        console.error(`Error retrieving summaries files: ${error}`);
    }
};
export const getFileTranslated = async () => {
    try {
        const drive = await getDriveService();
        const trnslatedFolder = await getBaseFolderByName("translated");
        const translatedFiles = (await drive.files.list({
            q: `"${trnslatedFolder}" in parents and mimeType = "application/pdf"`,
            fields: "files(id, name, mimeType)"
        })).data?.files;
        return translatedFiles;
    }
    catch (error) {
        console.error(`Error retrieving summaries files: ${error}`);
    }
};
export const getFolderId = async (year, month) => {
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
    }
    catch (error) {
        console.error(`Error retrieving folder ID for year: ${year}, month: ${month}`, error);
        return null;
    }
};
export const getFileText = async (file) => {
    try {
        const drive = await getDriveService();
        const text = (await drive.files.export({
            fileId: file.id,
            mimeType: "text/plain"
        })).data;
        return text;
    }
    catch (error) {
        console.error(`Error retrieving text content of file: ${file.id}`, error);
    }
};
export const getFileContentPdf = async (file) => {
    const drive = await getDriveService();
    try {
        const response = await drive.files.get({
            fileId: file.id,
            alt: "media",
        }, { responseType: "stream" });
        if (!response) {
            console.error(`Failed to fetch file content: ${response.status} - ${response.statusText}`);
        }
        const pdfBuffer = await streamToBuffer(response.data);
        return {
            id: file.id,
            name: file.name,
            content: pdfBuffer
        };
    }
    catch (error) {
        console.error("Error loading the PDF:", error);
    }
};
export const createPdfFile = async (pdfFile, folderId) => {
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
    }
    catch (error) {
        console.error(`Failed to create PDF file: ${pdfFile.name} in folder ID: ${folderId}`, error);
    }
};
//# sourceMappingURL=google-drive-api-service.js.map