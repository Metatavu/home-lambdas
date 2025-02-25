import { generatePreSignedUrl } from "src/services/s3-file-service";

export const injectPresignedUrls = async(content: string) => {
  const imageReferencePattern = /!\[([^\]]*)\]\(((?!http)[^)\s]+)\)/g;
  const matches = [...content.matchAll(imageReferencePattern)];

  const referencesToChange = await Promise.all(
    matches.map(async (imageReference) => {
      try {
        const altText = imageReference[1];
        const imagePath = imageReference[2];
        const presignedUrl = await generatePreSignedUrl(imagePath);

        return {
          originalReference: imageReference[0],
          altText: altText,
          presignedUrl: presignedUrl
        };
      } catch (error) {
        return null;
      }
    })
  );

  referencesToChange.forEach(reference => {
    content = content.replace(
      reference.originalReference, 
      `![${reference.altText}](${reference.presignedUrl})`
    );
  })

  return content;
}