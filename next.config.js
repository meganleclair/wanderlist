/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

// Force Node.js to prefer IPv4 over IPv6
const dns = require('dns')
dns.setDefaultResultOrder('ipv4first')

module.exports = nextConfig
