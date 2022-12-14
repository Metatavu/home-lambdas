/**
 * Interface for basic auth username and password pair
 */
export interface BasicAuth {
  username: string;
  password: string;
}

/**
 * Parses bearer auth username and password from authentication header
 * 
 * @param authorizationHeader authentication header
 * @returns basic auth username and password pair
 */
export const parseBearerAuth = (authorizationHeader?: string): BasicAuth | null => {
  if (!authorizationHeader?.toLocaleLowerCase().startsWith("bearer ")) {
    return null;
  } 

  const buffer = Buffer.from(authorizationHeader.substring(6), "base64");
  const decoded = buffer.toString();
  const parts = decoded.split(":");
  
  if (parts.length === 2) {
    return {
      username: parts[0],
      password: parts[1]
    };
  }

  return null;
}