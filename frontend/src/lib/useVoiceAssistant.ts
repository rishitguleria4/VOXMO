import { useState, useCallback, useEffect, useRef } from "react";
import { vapi } from "./vapi";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { BACKEND_URL } from "./config";

export function useVoiceAssistant() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0);
    
    const { jwt, refreshCredits, refreshConversations } = useAuth();
    
    const startTimeRef = useRef<number | null>(null);
    const messagesRef = useRef<any[]>([]);

    useEffect(() => {
        if (!vapi) return;

        const onCallStart = () => {
            setIsConnecting(false);
            setIsConnected(true);
            startTimeRef.current = Date.now();
            messagesRef.current = [];
        };

        const onCallEnd = async () => {
            setIsConnecting(false);
            setIsConnected(false);
            setIsAssistantSpeaking(false);
            setVolumeLevel(0);

            // Process call duration and messages
            const durationMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
            const durationSeconds = Math.floor(durationMs / 1000);
            const finalMessages = messagesRef.current;
            
            startTimeRef.current = null;
            messagesRef.current = [];

            if (!jwt) return;

            try {
                // 1. Deduct credits
                if (durationSeconds > 0) {
                    await axios.post(`${BACKEND_URL}/deduct-voice-credits`, 
                        { durationSeconds },
                        { headers: { Authorization: `Bearer ${jwt}` } }
                    );
                    refreshCredits();
                }

                // 2. Save conversation if there are messages
                if (finalMessages && finalMessages.length > 0) {
                    await axios.post(`${BACKEND_URL}/save-voice-conversation`,
                        { messages: finalMessages },
                        { headers: { Authorization: `Bearer ${jwt}` } }
                    );
                    refreshConversations();
                }
            } catch (err) {
                console.error("Failed to process voice call end:", err);
            }
        };

        const onSpeechStart = () => setIsAssistantSpeaking(true);
        const onSpeechEnd = () => setIsAssistantSpeaking(false);
        const onVolumeLevel = (level: number) => setVolumeLevel(level);
        
        const onMessage = (message: any) => {
            if (message.type === 'conversation-update') {
                messagesRef.current = message.conversation || message.messages || [];
            }
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("volume-level", onVolumeLevel);
        vapi.on("message", onMessage);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("volume-level", onVolumeLevel);
            vapi.off("message", onMessage);
        };
    }, [jwt, refreshCredits, refreshConversations]);

    const toggleCall = useCallback(async () => {
        if (!vapi) return;

        if (isConnected || isConnecting) {
            vapi.stop();
        } else {
            let assistantId = "your-vapi-assistant-id";
            try {
                assistantId = process.env.BUN_PUBLIC_VAPI_ASSISTANT_ID || process.env.VAPI_ASSISTANT_ID || process.env.VITE_VAPI_ASSISTANT_ID || "your-vapi-assistant-id";
            } catch (e) {
                // Ignore ReferenceError in browser during dev
            }
            if (!assistantId || assistantId === "your-vapi-assistant-id") {
                console.error("Vapi Assistant ID is missing. Please add it to your .env.local file.");
                alert("Please add your VAPI Assistant ID to .env.local");
                return;
            }

            setIsConnecting(true);
            try {
                await vapi.start(assistantId);
            } catch (err) {
                console.error("Failed to start Vapi call", err);
                setIsConnecting(false);
            }
        }
    }, [isConnected, isConnecting]);

    return {
        isConnecting,
        isConnected,
        isAssistantSpeaking,
        volumeLevel,
        toggleCall,
        hasSupport: !!vapi
    };
}
