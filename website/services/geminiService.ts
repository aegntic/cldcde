import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, SDK_SYSTEM_INSTRUCTION } from '../constants';

let chatSession: Chat | null = null;
let sdkSession: Chat | null = null;

// Initialize Gemini
// NOTE: We assume process.env.API_KEY is available.
const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing. Chat features will be disabled or mock response used.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const initializeChat = async (): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Connection established. (Mock Mode: API Key missing)";

  try {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return "CLD-9 System Online. Ready to assist.";
  } catch (error) {
    console.error("Failed to init chat", error);
    return "System Error: Neural Link Failed.";
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    const initialized = await initializeChat();
    if (!chatSession) return "Error: System offline. Please check API Key configuration.";
  }

  try {
    if(!chatSession) throw new Error("Chat session not active");
    const response: GenerateContentResponse = await chatSession.sendMessage({ message });
    return response.text || "No data received.";
  } catch (error) {
    console.error("Gemini Error", error);
    return "Error: Transmission interrupted.";
  }
};

// --- SDK Terminal Specific Services ---

export const initializeSDKChat = async (): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "SDK Connection (Mock)";
  
    try {
      sdkSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SDK_SYSTEM_INSTRUCTION,
        },
      });
      return "Connected to Claude Code SDK Kernel v2.4.1";
    } catch (error) {
      console.error("Failed to init SDK chat", error);
      return "SDK Init Failed.";
    }
};

export const sendSDKCommand = async (command: string): Promise<string> => {
    if (!sdkSession) {
        await initializeSDKChat();
        if (!sdkSession) return "Error: SDK Kernel Offline.";
    }
    
    try {
        if(!sdkSession) throw new Error("SDK session not active");
        const response: GenerateContentResponse = await sdkSession.sendMessage({ message: command });
        return response.text || "";
    } catch (error) {
        console.error("SDK Error", error);
        return "Error: Kernel Panic. Command execution failed.";
    }
};
