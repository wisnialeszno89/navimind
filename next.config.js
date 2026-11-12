/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist', '@napi-rs/canvas'],
    outputFileTracingIncludes: {
      '/api/workspace/document-plan': ['./pdf-runtime/**/*'],
    },
  },
};

module.exports = nextConfig;