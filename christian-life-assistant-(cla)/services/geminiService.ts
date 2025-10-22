import { GoogleGenAI, Chat, Type } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from '../constants';
import { Verse } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to show this to the user in the UI.
  console.error("API_KEY environment variable not set. Please set it in your environment.");
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export function createChatSession(): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-pro',
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS,
    },
  });
  return chat;
}

/**
 * Extracts Bible verses from a given text using a separate, fast AI model.
 * @param text The text content from the main AI's response.
 * @param existingTopics A list of topics that have already been used in the session.
 * @returns A promise that resolves to an array of Verse objects.
 */
export async function extractVerses(text: string, existingTopics: string[] = []): Promise<Verse[]> {
  try {
    let topicInstruction = `and 'topic' (a brief, one or two-word topic for the verse, e.g., 'Salvation', 'Faith', 'Creation').`;
    if (existingTopics.length > 0) {
        topicInstruction = `and 'topic' (a brief, one or two-word topic for the verse). IMPORTANT: Review the following list of existing topics. If a verse fits well into one of these, you MUST reuse the existing topic name exactly. Only create a new topic if it is genuinely distinct from the existing ones. Existing topics: [${existingTopics.join(', ')}]`;
    }

    const prompt = `You are an expert biblical text parser. Analyze the following text and extract every Bible verse reference and its full text. Return the result as a JSON array. Each object in the array should contain four keys: 'reference' (e.g., 'John 3:16'), 'text' (the full verse text), 'version' (e.g., 'NLT', 'KJV', 'ESV'), ${topicInstruction} If a version is not explicitly mentioned for a verse, default to 'NLT'. If no specific topic is apparent, use 'General'. Ensure the JSON is valid. If no verses are found, return an empty array.

Text to parse:
---
${text}
---
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              reference: {
                type: Type.STRING,
                description: "The book, chapter, and verse reference (e.g., John 3:16).",
              },
              text: {
                type: Type.STRING,
                description: "The full, verbatim text of the scripture.",
              },
              version: {
                type: Type.STRING,
                description: "The Bible version abbreviation (e.g., NLT, KJV, ESV).",
              },
              topic: {
                type: Type.STRING,
                description: "A brief, one or two-word topic for the verse (e.g., 'Salvation', 'Faith')."
              }
            },
            required: ['reference', 'text', 'version', 'topic'],
          },
        },
      },
    });

    const jsonStr = response.text.trim();
    if (!jsonStr) {
      return [];
    }
    const parsedVerses = JSON.parse(jsonStr) as Verse[];
    return parsedVerses;
  } catch (error) {
    console.error("Error extracting verses:", error);
    // Return an empty array on failure to avoid crashing the app
    return [];
  }
}

/**
 * Generates "Dig Deeper" suggestions based on a text.
 * @param text The text content from the main AI's response.
 * @returns A promise that resolves to an array of suggestion strings.
 */
export async function generateSuggestions(text: string): Promise<string[]> {
  try {
    const prompt = `You are a helpful assistant that generates thought-provoking follow-up questions. Based on the following text, provide 3 "dig deeper" suggestions that would encourage a user to explore the topic further. The suggestions should be concise and phrased as questions or commands. Return the result as a JSON array of strings.

Text:
---
${text}
---
`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonStr = response.text.trim();
     if (!jsonStr) {
      return [];
    }
    const parsedSuggestions = JSON.parse(jsonStr) as string[];
    return parsedSuggestions;
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
}