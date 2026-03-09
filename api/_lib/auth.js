import { parse } from 'cookie';

const COOKIE_NAME = 'phoenix_auth';
const APP_PASSWORD = process.env.APP_PASSWORD;

export function checkAuth(req) {
    const cookies = parse(req.headers.cookie || '');
    const cookieAuth = cookies[COOKIE_NAME] === 'true';
    if (cookieAuth) {
        return true;
    }

    const headerPassword = req.headers['x-app-password'];
    if (typeof headerPassword === 'string' && APP_PASSWORD && headerPassword === APP_PASSWORD) {
        return true;
    }

    const authHeader = req.headers.authorization || '';
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ') && APP_PASSWORD) {
        const token = authHeader.slice(7).trim();
        return token === APP_PASSWORD;
    }

    return false;
}
