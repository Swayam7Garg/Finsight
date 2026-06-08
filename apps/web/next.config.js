/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@finsight/shared-types"],
  output: "standalone",
  poweredByHeader: false,
};

module.exports = nextConfig;
