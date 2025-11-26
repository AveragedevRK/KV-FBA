import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set in the environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProductDescription = async (
  productName: string,
  asin: string, // Add asin as a parameter
): Promise<string> => {
  const client = getClient();
  if (!client) {
    throw new Error("API Key is missing. Please configure the API Key.");
  }

  const prompt = `
    Write a compelling, professional, and concise product description (max 100 words) for an e-commerce listing.
    
    Product Details:
    - Name: ${productName}
    - ASIN: ${asin}
    
    Focus on the key benefits and features. Do not use markdown formatting like bolding or bullet points, just plain text paragraphs.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error("Failed to generate description via Gemini.");
  }
};
