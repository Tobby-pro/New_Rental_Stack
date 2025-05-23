import { withNextVideo } from "next-video/process";
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,

    images: {
        domains: ['firebasestorage.googleapis.com', 'storage.googleapis.com'],
    },
};

export default withNextVideo(nextConfig);