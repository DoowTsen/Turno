import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@turno/api-sdk",
    "@turno/business",
    "@turno/constants",
    "@turno/i18n",
    "@turno/types",
    "@turno/ui-web",
  ],
};

export default nextConfig;
