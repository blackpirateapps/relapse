import { serialize } from 'cookie';

const PASSWORD = process.env.APP_PASSWORD;
const COOKIE_NAME = 'phoenix_auth';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { password } = req.body;

    if (password === PASSWORD) {
        const cookie = serialize(COOKIE_NAME, 'true', {
            httpOnly: true,
            // 'secure' is now mandatory for sameSite: 'none' to work.
            // This is safe because Vercel always uses HTTPS.
            secure: true, 
            // 'sameSite: none' allows the cookie to be sent to your external API.
            sameSite: 'none', 
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
        res.setHeader('Set-Cookie', cookie);
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
}
