import type { User } from "../schemas/keycloak/user";
import fetch from "node-fetch";

/**
 * Interface for a KeycloakApiService.
 */
export interface KeycloakApiService {
  getUsers: (event) => Promise<User[]>;
  findUser: (event) => Promise<User[]>;
}

/**
 * Creates KeycloakApiService
 */
export const CreateKeycloakApiService = (): KeycloakApiService => {
  const baseUrl: string = process.env.KEYCLOAK_BASE_URL;
  const realm: string = process.env.KEYCLOAK_REALM;
  

  return {
    /**
     * Gets all users from keycloak
     *
     * @returns List of users
     */
    getUsers: async (event): Promise<User[]> => {
      
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      
      if (!authHeader) {
        throw new Error("Missing Authorization header.");
      } 
      const token = authHeader.split(' ')[1];
      
      const response = await fetch(`${baseUrl}/admin/realms/${realm}/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch users: ${response.status} - ${response.statusText}`,
        );
      }

      return response.json();
    },

    /**
     * Find user from keycloak
     *
     * @param id string
     * @returns user by Id
     */
    findUser: async (event): Promise<User[]> => {
      
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      if (!authHeader) {
        throw new Error("Missing Authorization header.");
      } 
      const token = authHeader.split(' ')[1];
      const { id } = event.pathParameters;

      const response = await fetch(
        `${baseUrl}/admin/realms/${realm}/users/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to find user with id: ${id}`);
      }

      return response.json();
    },
  };
};

/**
 * Requests an access token from keycloak API
 *
 * @returns access token as string
 */
// const getAccessToken = async (): Promise<string> => {
//   const realm: string = process.env.KEYCLOAK_REALM;
//   const url: string = `${process.env.KEYCLOAK_BASE_URL}/realms/${realm}/protocol/openid-connect/token`;

//   const requestBody = new URLSearchParams({
//     client_id: process.env.KEYCLOAK_CLIENT_ID,
//     client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
//     username: process.env.KEYCLOAK_ADMIN_USERNAME,
//     password: process.env.KEYCLOAK_ADMIN_PASSWORD,
//     grant_type: "client_credentials",
//   });

//   try {
//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body: requestBody.toString(),
//     });
//     const jsonResponse = await response.json();

//     return jsonResponse.access_token;
//   } catch (error) {
//     throw error(error);
//   }
// };
