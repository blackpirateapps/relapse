// Simple local dev server for API testing
// Run with: node dev-server.js

import 'dotenv/config';
import http from 'http';
import { parse } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manually load .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && !key.startsWith('#')) {
            const value = valueParts.join('=').trim();
            if (value && !process.env[key.trim()]) {
                process.env[key.trim()] = value;
            }
        }
    });
}

console.log('Environment loaded:');
console.log('  APP_PASSWORD:', process.env.APP_PASSWORD ? 'SET' : 'NOT SET');
console.log('  TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'SET' : 'NOT SET');

// Dynamic import of API handlers
const apiHandlers = {};

async function loadHandler(name) {
    if (!apiHandlers[name]) {
        try {
            const module = await import(`./api/${name}.js`);
            apiHandlers[name] = module.default;
        } catch (e) {
            console.error(`Failed to load handler ${name}:`, e.message);
            return null;
        }
    }
    return apiHandlers[name];
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log(`${req.method} ${pathname}`);

    // Add Vercel-compatible response methods
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    };

    // Handle API routes
    if (pathname.startsWith('/api/')) {
        const apiName = pathname.replace('/api/', '').replace(/\/$/, '');
        const handler = await loadHandler(apiName);

        if (handler) {
            try {
                await handler(req, res);
            } catch (e) {
                console.error('Handler error:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API not found' }));
        }
        return;
    }

    // For non-API routes, just return a simple message
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>API Server Running</h1><p>Use /api/* routes</p>');
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`\nAPI Server running at http://localhost:${PORT}`);
    console.log('Test login with:');
    console.log(`  curl -X POST http://localhost:${PORT}/api/login -H "Content-Type: application/json" -d '{"password":"YOUR_PASSWORD"}'`);
});
