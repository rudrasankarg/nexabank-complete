/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ['localhost:3000'] } },
  images: {
    domains: ['nexabank-documents.s3.ap-south-1.amazonaws.com', 'ui-avatars.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  async redirects() {
    return [
      {
        source: '/reset-password',
        destination: '/auth/reset-password',
        permanent: true,
      },
      {
        source: '/verify-email',
        destination: '/auth/verify-email',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
      {
        source: '/forgot-password',
        destination: '/auth/forgot-password',
        permanent: true,
      }
    ];
  },
};
module.exports = nextConfig;
