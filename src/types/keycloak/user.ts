/**
 * Custom Interface for a user in keycloak functions with isActive, severaUserId.
 */
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    severaUserId: string;
}