export type MainOption = 'known' | 'unknown' | 'several' | null;
export type ResearchType = 'single' | 'multi' | null;
export type Option = 'research' | 'compare' | 'recommend' | null;
export type Importance = 'Not important' | 'Important' | 'Very Important';
export type Step = 1 | 1.25 | 1.5 | 2 | 3 | 5 | 6 | 6.5;

export interface Feature {
    id: number;
    name: string;
    importance: Importance;
}

export interface Product {
    name: string;
    features: Feature[];
    price?: number;
    url?: string;
    platform?: string;
}

export interface ProductConsideration {
    key: string;
    value: string;
}

export interface ProductInfo {
    productName: string;
    considerations: ProductConsideration[];
}

export interface ProductComparison {
    mainProduct: string;
    alternatives: {
        name: string;
        considerations: ProductConsideration[];
    }[];
}

export interface ProductRecommendations {
    recommendations: {
        name: string;
        considerations: ProductConsideration[];
    }[];
}

export interface VideoResult {
    id: string;
    title: string;
    description: string;
    analysis: string;
}

export interface ProductReport {
    productName: string;
    youtubeResults: VideoResult[];
    websiteResults: string;
    redditResults: string;
    finalReport: string;
}

export interface ComparisonReport {
    introduction: string;
    recommendation: string;
    reasoning: string;
    features: Array<{
        name: string;
        importance: string;
        analysis: string;
    }>;
    limitations: string[];
    conclusion: string;
}

export interface ResearchResults {
    reports: ProductReport[];
    comparisonReport?: string;
}

export interface ApiLog {
    timestamp: string;
    type: 'youtube' | 'openai' | 'perplexity' | 'research';
    endpoint: string;
    request?: {
        method: string;
        headers: Record<string, string>;
        url?: string;
        body?: any;
    };
    response?: {
        status: number;
        headers: Record<string, string>;
        body?: any;
    };
    error?: {
        message: string;
        stack?: string;
    };
}

export interface ResearchError {
    message: string;
    logs: ApiLog[];
}

export interface FeatureSet {
    veryImportant: string[];
    important: string[];
}

export interface ReviewResult {
    productName: string;
    verdict: "Recommended" | "Not Recommended";
    matchScore: number;
    explanation: string;
    specs?: string[];
}

export interface SeveralProductResult {
    name: string;
    specs: { icon: string; label: string; value: string }[];
    review: string;
    score: number;
}