import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { ProductInfo, ProductComparison, ProductRecommendations, ProductReport, FeatureSet, ReviewResult } from '@/types/product';

// Initialize with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ],
});

const jsonModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ],
});

let apiLogs: any[] = [];

export function getApiLogs() {
    return apiLogs;
}

export function clearApiLogs() {
    apiLogs = [];
}

function addApiLog(log: any) {
    apiLogs.push(log);
    console.log(`API Log [${log.type}]:`, log);
}

async function generateJson<T>(prompt: string, logType: string): Promise<T> {
    const timestamp = new Date().toISOString();
    try {
        addApiLog({ timestamp, type: 'gemini', endpoint: logType, request: { prompt: prompt.substring(0, 100) + '...' } });

        const result = await jsonModel.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);
        if (!jsonMatch) throw new Error('No valid JSON found in response');

        const parsed = JSON.parse((jsonMatch[1] || jsonMatch[2]).trim());

        addApiLog({ timestamp, type: 'gemini', endpoint: logType, response: { status: 200, body: 'Success' } });
        return parsed as T;
    } catch (error) {
        addApiLog({ timestamp, type: 'gemini', endpoint: logType, error: { message: error instanceof Error ? error.message : 'Unknown error' } });
        throw error;
    }
}

export async function fetchProductInfo(productName: string): Promise<ProductInfo> {
    const prompt = `Provide a feature list for "${productName}".
  Include the top 6 most meaningful and relevant attributes (features) and their descriptions.
  Each feature name MUST be in Title Case format.
  Respond in this exact JSON format:
  {
    "productName": "${productName}",
    "considerations": [
      { "key": "Feature Name", "value": "Description" }
    ]
  }`;
    return generateJson<ProductInfo>(prompt, 'fetchProductInfo');
}

export async function fetchProductComparisons(productName: string): Promise<ProductComparison> {
    const prompt = `Suggest top 3 alternative products for "${productName}".
  Respond in this exact JSON format:
  {
    "mainProduct": "${productName}",
    "alternatives": [
      { "name": "Alt Product Name", "considerations": [{ "key": "Feature", "value": "Comparison" }] }
    ]
  }`;
    return generateJson<ProductComparison>(prompt, 'fetchProductComparisons');
}

export async function fetchProductRecommendations(userDescription: string): Promise<ProductRecommendations> {
    const prompt = `Based on this user need: "${userDescription}", identify the 6 most important technical specifications or features a buyer should consider. 
  Also, suggest the top 4 specific products that best meet this description.
  
  Respond in this exact JSON format:
  {
    "recommendations": [
      { 
        "name": "Product Name", 
        "considerations": [
          { "key": "Feature Name", "value": "Why it matters for this product" }
        ] 
      }
    ]
  }`;
    return generateJson<ProductRecommendations>(prompt, 'fetchProductRecommendations');
}

export async function performDeepResearch(
    productName: string,
    features: FeatureSet
): Promise<ProductReport> {
    const timestamp = new Date().toISOString();

    const prompt = `Review "${productName}" based on these priorities: ${features.veryImportant.join(', ')}.
  
  CRITICAL: Do not write a full report. 
  Output a SINGLE JSON object with a "finalReport" field containing exactly 2 or 3 sentences.
  The sentences must clearly state if the product is good and why, addressing the user's top priority.

  Respond in this exact JSON format:
  {
    "productName": "${productName}",
    "youtubeResults": [], 
    "websiteResults": "",
    "redditResults": "",
    "finalReport": "Your 2-3 sentence verdict here."
  }`;

    try {
        addApiLog({ timestamp, type: 'gemini', endpoint: 'deepResearch', request: { productName } });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);

        if (!jsonMatch) throw new Error('Invalid AI response');

        const parsedData = JSON.parse((jsonMatch[1] || jsonMatch[2]).trim());
        return parsedData;

    } catch (error) {
        addApiLog({ timestamp, type: 'gemini', endpoint: 'deepResearch', error: { message: error instanceof Error ? error.message : 'Timeout' } });
        throw error;
    }
}

export async function generateComparisonReport(products: string[], features: FeatureSet, reports: string[]): Promise<string> {
    const prompt = `Compare these products: ${products.join(', ')}.
   Priorities: ${JSON.stringify(features)}.
   
   Output ONLY a 2-3 sentence recommendation. 
   Name the winner clearly and give the main reason why.
   Do not use introduction, limitations, or feature lists.
   
   Return JSON: { "verdict": "The 2-3 sentence text here" }`;

    const res = await generateJson<any>(prompt, 'comparisonReport');
    return JSON.stringify(res);
}

export async function reviewProduct(productName: string, userPreferences: string): Promise<ReviewResult> {
    const prompt = `You are a Pakistani tech shopping expert.
  User wants: "${productName}"
  Their requirements: "${userPreferences}"

  Based on these requirements, identify the SINGLE BEST specific product available in Pakistan that matches.
  
  Then provide:
  1. The exact product name (brand + model)
  2. Its top 3 key specs in simple one-liners
  3. A 2-line summary of what real users say about it (common praise and common complaint)

  Respond in this exact JSON format:
  {
    "productName": "Exact Product Name e.g. Samsung Galaxy A55 5G",
    "verdict": "Recommended",
    "matchScore": 90,
    "explanation": "Users love its battery life and clean software. Some complain about average low-light camera performance.",
    "specs": [
      "Processor: Snapdragon 778G — smooth daily performance",
      "Battery: 5000mAh — easily lasts full day",
      "Camera: 50MP OIS — great daylight shots"
    ]
  }`;

    return generateJson<ReviewResult>(prompt, 'reviewProduct');
}