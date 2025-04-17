import fetch from "node-fetch";
export const CreateKeycloakApiService = () => {
    const baseUrl = process.env.KEYCLOAK_BASE_URL;
    const realm = process.env.KEYCLOAK_REALM;
    return {
        getUsers: async () => {
            const response = await fetch(`${baseUrl}/admin/realms/${realm}/users`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${await getAccessToken()}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status} - ${response.statusText}`);
            }
            const users = await response.json();
            return users.map((user) => ({
                ...user,
                severaUserId: user.severaUserId ?? undefined,
            }));
        },
        findUser: async (id) => {
            try {
                const response = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${await getAccessToken()}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Failed to find user with id: ${id}`);
                }
                const user = await response.json();
                return {
                    ...user,
                    severaUserId: user.severaUserId ?? undefined,
                };
            }
            catch (error) {
                throw new Error(`An error occurred while fetching the user: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        },
        updateUserAttributes: async (id, attributes) => {
            try {
                const userDetailsResponse = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${await getAccessToken()}`,
                    },
                });
                if (!userDetailsResponse.ok) {
                    const errorText = await userDetailsResponse.text();
                    throw new Error(`Failed to fetch user details: ${userDetailsResponse.status} - ${userDetailsResponse.statusText}. Details: ${errorText}`);
                }
                const userDetails = await userDetailsResponse.json();
                const firstName = userDetails.firstName;
                const lastName = userDetails.lastName;
                const existingEmail = userDetails.email;
                const existingAttributes = userDetails.attributes || {};
                const updatedAttributes = {
                    ...existingAttributes,
                    ...attributes,
                };
                const bodyContent = {
                    email: existingEmail,
                    firstName: firstName,
                    lastName: lastName,
                    attributes: updatedAttributes,
                };
                const updateResponse = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${await getAccessToken()}`,
                    },
                    body: JSON.stringify(bodyContent),
                });
                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update user attributes: ${updateResponse.status} - ${updateResponse.statusText}. Details: ${errorText}`);
                }
            }
            catch (error) {
                throw new Error(error instanceof Error
                    ? error.message
                    : "An unknown error occurred while updating user attribute");
            }
        },
        removeUserAttribute: async (id, attributeName) => {
            try {
                const response = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${await getAccessToken()}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch user data: ${response.status} - ${response.statusText}. Details: ${errorText}`);
                }
                const user = await response.json();
                const existingEmail = user.email;
                const currentAttributes = user.attributes || {};
                delete currentAttributes[attributeName];
                const bodyContent = {
                    email: existingEmail,
                    attributes: currentAttributes,
                };
                const updateResponse = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${await getAccessToken()}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(bodyContent),
                });
                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update user attributes: ${updateResponse.status} - ${updateResponse.statusText}. Details: ${errorText}`);
                }
            }
            catch (error) {
                throw new Error(error instanceof Error
                    ? error.message
                    : "An unknown error occurred while removing the user attribute.");
            }
        },
        getUserAttributes: async (id) => {
            try {
                const response = await fetch(`${baseUrl}/admin/realms/${realm}/users/${id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${await getAccessToken()}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) {
                    throw new Error(`Failed to get user attributes: ${response.status} - ${response.statusText}`);
                }
                const user = await response.json();
                return user.attributes || {};
            }
            catch (error) {
                throw new Error(`An error occurred while fetching user attributes: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        },
    };
};
const getAccessToken = async () => {
    const realm = process.env.KEYCLOAK_REALM;
    const url = `${process.env.KEYCLOAK_BASE_URL}/realms/${realm}/protocol/openid-connect/token`;
    const requestBody = new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_ADMIN_SECRET,
        grant_type: "client_credentials",
    });
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: requestBody.toString(),
        });
        const jsonResponse = await response.json();
        return jsonResponse.access_token;
    }
    catch (error) {
        throw new Error(error);
    }
};
//# sourceMappingURL=keycloak-api-service.js.map