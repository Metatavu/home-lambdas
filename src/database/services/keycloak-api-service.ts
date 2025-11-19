import fetch from "node-fetch";

/**
 * Minimal Keycloak User Profile type based on Admin REST API
 */
export interface KeycloakUserProfile {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, string[]>;
}

/**
 * Custom Interface for a user in keycloak functions with severaUserId added.
 */
export interface CustomKeycloakProfile extends KeycloakUserProfile {
  severaUserId: string;
}

/**
 * Interface for a KeycloakApiService.
 */
export interface KeycloakApiService {
  getUsers: () => Promise<CustomKeycloakProfile[]>;
  findUser: (id: string) => Promise<CustomKeycloakProfile>;
  updateUserAttributes: (
    id: string,
    attributes: Record<string, string[]>
  ) => Promise<{ updatedFields: Record<string, string[]> }>;
  removeUserAttribute: (id: string, attributeName: string) => Promise<void>;
  getUserAttributes: (id: string) => Promise<Record<string, string[]>>;
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
    getUsers: async (): Promise<CustomKeycloakProfile[]> => {
      const response = await fetch(`${baseUrl}/admin/realms/${realm}/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} - ${response.statusText}`);
      }

      const users: KeycloakUserProfile[] = await response.json();
      return users.map((user) => ({
        ...user,
        severaUserId: user.attributes?.severaUserId?.[0]
      }));
    },

    /**
     * Find user from keycloak
     *
     * @param id string
     * @returns user by Id
     */
    findUser: async (id: string): Promise<CustomKeycloakProfile> => {
      try {
        const response = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to find user with id: ${id}`);
        }

        const user: KeycloakUserProfile = await response.json();
        return {
          ...user,
          severaUserId: user.attributes?.severaUserId?.[0]
        };
      } catch (error) {
        throw new Error(
          `An error occurred while fetching the user: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },

    /**
     * Updates a user's attributes
     *
     * @param id string
     * @param attributes Record<string, string[]>
     * @returns success boolean and updated fields
     */
    updateUserAttributes: async (
      id: string,
      attributes: Record<string, string[]>
    ): Promise<{ updatedFields: Record<string, string[]> }> => {
      try {
        const userDetailsResponse = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAccessToken()}`
          }
        });

        if (!userDetailsResponse.ok) {
          const errorText = await userDetailsResponse.text();
          throw new Error(
            `Failed to fetch user details: ${userDetailsResponse.status} - ${userDetailsResponse.statusText}. Details: ${errorText}`
          );
        }
        const userDetails: KeycloakUserProfile = await userDetailsResponse.json();
        const existingAttributes = userDetails.attributes || {};

        const existingEmail = userDetails.email;

        const updatedAttributes = {
          ...existingAttributes,
          ...attributes
        };

        const bodyContent = {
          attributes: updatedAttributes,
          email: existingEmail
        };

        const updateResponse = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAccessToken()}`
          },
          body: JSON.stringify(bodyContent)
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(
            `Failed to update user attributes: ${updateResponse.status} - ${updateResponse.statusText}. Details: ${errorText}`
          );
        }
        return {
          updatedFields: bodyContent.attributes
        };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "An unknown error occurred while updating user attribute"
        );
      }
    },

    /**
     * Remove user attributes
     *
     * @param id  string
     * @param attributeName string
     */
    removeUserAttribute: async (id: string, attributeName: string): Promise<void> => {
      try {
        const response = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch user data: ${response.status} - ${response.statusText}. Details: ${errorText}`
          );
        }

        const user: KeycloakUserProfile = await response.json();
        const existingEmail = user.email;

        const currentAttributes = user.attributes || {};

        delete currentAttributes[attributeName];

        const bodyContent = {
          email: existingEmail,
          attributes: currentAttributes
        };

        const updateResponse = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bodyContent)
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(
            `Failed to update user attributes: ${updateResponse.status} - ${updateResponse.statusText}. Details: ${errorText}`
          );
        }
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "An unknown error occurred while removing the user attribute."
        );
      }
    },

    getUserAttributes: async (id: string): Promise<Record<string, string[]>> => {
      try {
        const response = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(
            `Failed to get user attributes: ${response.status} - ${response.statusText}`
          );
        }

        const user: KeycloakUserProfile = await response.json();
        return user.attributes || {};
      } catch (error) {
        throw new Error(
          `An error occurred while fetching user attributes: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  };
};

/**
 * Requests an access token from keycloak API
 *
 * @returns access token as string
 */
const getAccessToken = async (): Promise<string> => {
  const realm: string = process.env.KEYCLOAK_REALM;
  const url: string = `${process.env.KEYCLOAK_BASE_URL}/realms/${realm}/protocol/openid-connect/token`;

  const requestBody = new URLSearchParams({
    client_id: process.env.KEYCLOAK_CLIENT_ID,
    client_secret: process.env.KEYCLOAK_ADMIN_SECRET,
    grant_type: "client_credentials"
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: requestBody.toString()
    });
    const jsonResponse = await response.json();

    return jsonResponse.access_token;
  } catch (error) {
    throw new Error(error);
  }
};
