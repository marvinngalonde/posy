/** @type {import('next').NextConfig} */
const nextConfig = {
  // Replace next-transpile-modules with native transpilePackages
  transpilePackages: ['jspdf', 'canvg', 'core-js'],

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  devIndicators: false,

  webpack(config, { isServer }) {
    console.log('isServer:', isServer);
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false, // fix for .mjs issues in jspdf/canvg/core-js
      },
    });

    // Exclude Puppeteer and related modules from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
      };

      config.externals = config.externals || [];
      config.externals.push({
        puppeteer: 'puppeteer',
        'puppeteer-core': 'puppeteer-core',
        handlebars: 'handlebars',
      });
    }

    return config;
  },
 
  
};



export default nextConfig;
