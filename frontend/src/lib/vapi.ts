import VapiPackage from "@vapi-ai/web";

// Handle CJS/ESM interop in Bun's browser bundler/Vite
const Vapi = (VapiPackage as any).default || VapiPackage;

let vapiPublicKey = "";
try {
    // Vite uses import.meta.env for client-side environment variables prefixed with VITE_
    vapiPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || "your-vapi-public-key";
} catch (e) {
    // Ignore ReferenceError
}

// Initialize Vapi with the public key
// We only initialize this if we are running in the browser
export const vapi = typeof window !== "undefined" ? new Vapi(vapiPublicKey) : null;
