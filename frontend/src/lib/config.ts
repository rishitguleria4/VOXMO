let url = "http://localhost:3002";
try {
    // Bun.build will statically replace this in production
    url = process.env.BACKEND_URL || "http://localhost:3002";
} catch (e) {
    // Ignore ReferenceError in browser during dev
}
export const BACKEND_URL = url;