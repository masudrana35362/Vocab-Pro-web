"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateExampleSentence(word: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Write a single, meaningful example sentence using the word '${word}'. Only return the sentence, nothing else.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text ? text.trim() : null;
  } catch (error) {
    console.error("Error generating sentence with Gemini:", error);
    return null;
  }
}
