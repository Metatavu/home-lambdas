import * as jwt from 'jsonwebtoken';
export const getAuthDataFromToken = (event) => {
    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
            console.error("Missing Authorization header.");
            return null;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            console.error("Authorization header does not contain a valid token.");
            return null;
        }
        const decodedToken = jwt.decode(token);
        if (!decodedToken || typeof decodedToken === 'string') {
            console.error("Invalid token format or content.");
            return null;
        }
        if (!decodedToken.sub) {
            console.error("Token is missing 'sub' claim.");
            return null;
        }
        console.log('Decoded JWT Token:', JSON.stringify(decodedToken, null, 2));
        return {
            sub: decodedToken.sub
        };
    }
    catch (error) {
        console.error('Error decoding JWT token:', error);
        return null;
    }
};
//# sourceMappingURL=auth-utils.js.map