/** @type {import('next').NextConfig} */
const securityHeaders = [
    { key: 'Content-Security-Policy', value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:" },
    { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(), payment=()' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
];

if (process.env.NODE_ENV === 'production') {
    securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
    });
}

const nextConfig = {
    allowedDevOrigins: ['192.168.29.178'],
    poweredByHeader: false,
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
};
export default nextConfig;
