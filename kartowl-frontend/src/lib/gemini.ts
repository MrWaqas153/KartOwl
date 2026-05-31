import Groq from 'groq-sdk';
import type { ProductInfo, ProductComparison, ProductRecommendations, ProductReport, FeatureSet, ReviewResult } from '@/types/product';

const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
    dangerouslyAllowBrowser: true,
});

const MODEL = 'llama-3.3-70b-versatile';

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
        addApiLog({ timestamp, type: 'groq', endpoint: logType, request: { prompt: prompt.substring(0, 100) + '...' } });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant. Always respond with valid JSON only. No markdown, no explanation, just pure JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: MODEL,
            temperature: 0.3,
            response_format: { type: 'json_object' },
        });

        const text = completion.choices[0]?.message?.content || '';
        const parsed = JSON.parse(text);

        addApiLog({ timestamp, type: 'groq', endpoint: logType, response: { status: 200, body: 'Success' } });
        return parsed as T;
    } catch (error) {
        addApiLog({ timestamp, type: 'groq', endpoint: logType, error: { message: error instanceof Error ? error.message : 'Unknown error' } });
        throw error;
    }
}

export async function fetchProductInfo(productName: string): Promise<ProductInfo> {
    const prompt = `Provide a feature list for "${productName}".
Include the top 6 most meaningful and relevant attributes and their descriptions.
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
Output a SINGLE JSON object with a "finalReport" field containing exactly 2 or 3 sentences.
The sentences must clearly state if the product is good and why.
Respond in this exact JSON format:
{
  "productName": "${productName}",
  "youtubeResults": [],
  "websiteResults": "",
  "redditResults": "",
  "finalReport": "Your 2-3 sentence verdict here."
}`;

    try {
        addApiLog({ timestamp, type: 'groq', endpoint: 'deepResearch', request: { productName } });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: MODEL,
            temperature: 0.3,
            response_format: { type: 'json_object' },
        });

        const text = completion.choices[0]?.message?.content || '';
        const parsedData = JSON.parse(text);
        return parsedData;

    } catch (error) {
        addApiLog({ timestamp, type: 'groq', endpoint: 'deepResearch', error: { message: error instanceof Error ? error.message : 'Timeout' } });
        throw error;
    }
}

export async function generateComparisonReport(products: string[], features: FeatureSet, reports: string[]): Promise<string> {
    const prompt = `Compare these products: ${products.join(', ')}.
Priorities: ${JSON.stringify(features)}.
Output ONLY a 2-3 sentence recommendation.
Name the winner clearly and give the main reason why.
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