let url = "http://localhost:3002";
try {
    // Vite statically replaces import.meta.env variables during build time.
    url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";
} catch (e) {
    // Ignore ReferenceError in browser during dev
}
export const BACKEND_URL = url;