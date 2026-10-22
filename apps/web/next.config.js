/** @type {import('next').NextConfig} */
const path = require("node:path");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig = {
  poweredByHeader: false,
};

module.exports = nextConfig;
