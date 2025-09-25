import { serialize } from 'cookie';

const PASSWORD = process.env.APP_PASSWORD;
const COOKIE_NAME = 'phoenix_auth';

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', err => reject(err));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { password } = await parseJsonBody(req);
    
    if (password === PASSWORD) {
      const cookie = serialize(COOKIE_NAME, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
      
      res.setHeader('Set-Cookie', cookie);
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
      res.status(400).json({ success: false, message: 'Invalid request body' });
  }
}
