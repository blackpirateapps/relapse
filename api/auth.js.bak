import { parse } from 'cookie';

const COOKIE_NAME = 'phoenix_auth';

export function checkAuth(req) {
    const cookies = parse(req.headers.cookie || '');
    return cookies[COOKIE_NAME] === 'true';
}
