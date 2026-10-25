import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';
const monorepoRoot = fileURLToPath(new URL('../..', import.meta.url));

// CSP: allow 'unsafe-eval' in dev for React hot reloading and debugging
const scriptSrc = isDev ?
    "'self' 'unsafe-inline' 'unsafe-eval'" :
    "'self' 'unsafe-inline'";

const securityHeaders = [{
        key: 'Content-Security-Policy',
        value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' https://api.producthunt.com data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:`
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), geolocation=(), microphone=(), payment=()'
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
    },
];

if (!isDev) {
    securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
    });
}

const nextConfig = {
    allowedDevOrigins: ['192.168.29.178'],
    poweredByHeader: false,
    turbopack: {
        // Point to monorepo root so Turbopack can find node_modules
        root: monorepoRoot,
    },
    async headers() {
        return [{
            source: '/(.*)',
            headers: securityHeaders,
        }, ];
    },
};
export default nextConfig;
