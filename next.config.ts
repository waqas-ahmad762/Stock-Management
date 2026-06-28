import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The MongoDB driver is a server-only package with optional native
  // dependencies. Keep it out of the bundler so it loads from node_modules
  // at runtime in the Node.js server environment.
  serverExternalPackages: ["mongodb", "nodemailer"],
};

export default nextConfig;
