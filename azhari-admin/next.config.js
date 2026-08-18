/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export: this app talks directly to Supabase from the
  // browser using the anon key, and Row Level Security (see schema.sql) is
  // what actually enforces who can read/write what — there's no server-side
  // secret or custom API to host. That means this deploys anywhere that
  // serves static files (Vercel, Netlify, GitHub Pages, S3, your own nginx).
  output: "export",
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
