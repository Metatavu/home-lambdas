import fetch from "node-fetch";
import { ParsedAccessToken } from "src/types/meta-assistant/index";

/**
 * Namespace for Authentication
 */
namespace Auth {
  const { KEYCLOAK_BASE_URL, KEYCLOAK_REALM, KEYCLOAK_USERNAME, KEYCLOAK_PASSWORD, KEYCLOAK_CLIENT, KEYCLOAK_CLIENT_SECRET } = process.env;

  /**
   * Get access token from keycloak
   */
  export const getAccessToken = async (): Promise<ParsedAccessToken> => {
    const headers = {};
    headers["Content-Type"] = "application/x-www-form-urlencoded";

    const credentials = {
      "username": KEYCLOAK_USERNAME,
      "password": KEYCLOAK_PASSWORD,
      "grant_type": "password",
      "client_id": KEYCLOAK_CLIENT,
      "client_secret": KEYCLOAK_CLIENT_SECRET
    };

    let formBody = new URLSearchParams;
    for (const property in credentials) {
      let encodedKey = encodeURIComponent(property);
      let encodedValue = encodeURIComponent(credentials[property]);
      formBody.append(encodedKey, encodedValue);
    }

    const response = await fetch(`${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: "POST",
      headers: headers,
      body: formBody
    });

    if (response.status === 200) {
      const data: any = await response.json();
      return { accessToken: data.access_token } as ParsedAccessToken;
    }
  };
}

export default Auth;