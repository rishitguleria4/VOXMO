import VapiPackage from "@vapi-ai/web";

// Handle CJS/ESM interop in Bun's browser bundler
const Vapi = (VapiPackage as any).default || VapiPackage;

let vapiPublicKey = "";
try {
    vapiPublicKey = process.env.BUN_PUBLIC_VAPI_PUBLIC_KEY || process.env.VAPI_PUBLIC_KEY || process.env.VITE_VAPI_PUBLIC_KEY || "your-vapi-public-key";
} catch (e) {
    // Ignore ReferenceError in browser during dev
}

// Initialize Vapi with the public key
// We only initialize this if we are running in the browser
export const vapi = typeof window !== "undefined" ? new Vapi(vapiPublicKey) : null;
