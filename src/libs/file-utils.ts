import { Readable } from "stream";

/**
 * Converts readable stream to Buffer
 * 
 * @param stream  stream content to convert into Buffer
 * @returns Buffer object
 */
export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}