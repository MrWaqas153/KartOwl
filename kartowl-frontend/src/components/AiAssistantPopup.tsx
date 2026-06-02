import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Bot, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiLogs, clearApiLogs, fetchProductInfo, fetchProductComparisons, fetchProductRecommendations, performDeepResearch, generateComparisonReport, reviewProduct, fetchSeveralProducts } from '@/lib/gemini';
import { performResearch, performMultiProductResearch } from '@/lib/research';
import type { MainOption, ResearchType, Option, Product, Step, ResearchResults, ReviewResult, SeveralProductResult } from '@/types/product';
import { ErrorDialog } from "@/components/ui/error-dialog";
import { StepOne } from "./ProductReviewer/StepOne";
import { StepOnePointTwoFive } from "./ProductReviewer/StepOnePointTwoFive";
import { StepOnePointFive } from "./ProductReviewer/StepOnePointFive";
import { StepTwo } from "./ProductReviewer/StepTwo";
import { StepThree } from "./ProductReviewer/StepThree";
import { StepFour } from "./ProductReviewer/StepFour";
import { StepFive } from "./ProductReviewer/StepFive";
import { StepSeveralInput } from "./ProductReviewer/StepSeveralInput";
import { StepSeveralResults } from "./ProductReviewer/StepSeveralResults";

export function AiAssistantPopup() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [mainOption, setMainOption] = useState<MainOption>(null);
    const [researchType, setResearchType] = useState<ResearchType>(null);
    const [option, setOption] = useState<Option>(null);
    const [input, setInput] = useState("");
    const [userPreferences, setUserPreferences] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [newFeature, setNewFeature] = useState("");
    const [research, setResearch] = useState<ResearchResults | ReviewResult | null>(null);
    const [severalResults, setSeveralResults] = useState<SeveralProductResult[] | null>(null);
    const [severalQuery, setSeveralQuery] = useState("");
    const { toast } = useToast();

    const resetState = () => {
        setStep(1);
        setMainOption(null);
        setResearchType(null);
        setOption(null);
        setInput("");
        setUserPreferences("");
        setProducts([]);
        setResearch(null);
        setSeveralResults(null);
        setSeveralQuery("");
        clearApiLogs();
    };

    const handleMainOptionSelect = (selectedOption: MainOption) => {
        setMainOption(selectedOption);
        if (selectedOption === 'known') {
            setStep(1.25);
        } else if (selectedOption === 'several') {
            setStep(6);
        } else {
            // 'unknown' = help me research → seedha product input
            setOption('research');
            setResearchType('single');
            setStep(1.5);
        }
    };

    const handleResearchTypeSelect = (type: ResearchType) => {
        setResearchType(type);
        if (type === 'single') {
            setOption('research');
            setStep(1.5);
        } else {
            setOption('compare');
            setStep(1.5);
        }
    };

    const handleOptionSelect = async (selectedOption: Option) => {
        setOption(selectedOption);
        if (!input.trim()) return;

        setLoading(true);
        try {
            switch (selectedOption) {
                case 'research': {
                    const review = await reviewProduct(input, userPreferences);
                    setResearch(review);
                    setStep(5);
                    break;
                }
                case 'compare': {
                    const comparisons = await fetchProductComparisons(input);
                    setProducts([
                        { name: comparisons.mainProduct, features: [] },
                        ...comparisons.alternatives.map(alt => ({ name: alt.name, features: [] }))
                    ]);
                    setStep(3);
                    break;
                }
                case 'recommend': {
                    const recs = await fetchProductRecommendations(input);
                    const featureList = recs.recommendations[0].considerations.map((c, i) => ({
                        id: i,
                        name: c.key,
                        importance: 'Important' as const
                    }));
                    setProducts([
                        { name: 'Features', features: featureList },
                        ...recs.recommendations.map(r => ({ name: r.name, features: [] }))
                    ]);
                    setStep(3);
                    break;
                }
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to fetch data. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSeveralSubmit = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setSeveralQuery(input);
        try {
            const results = await fetchSeveralProducts(input);
            setSeveralResults(results);
            setStep(6.5);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to fetch products. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStartResearch = async () => {
        setLoading(true);
        try {
            const featuresProduct = products.find(p => p.name === 'Features');
            const featureSet = {
                veryImportant: featuresProduct?.features.filter(f => f.importance === 'Very Important').map(f => f.name) || [],
                important: featuresProduct?.features.filter(f => f.importance === 'Important').map(f => f.name) || []
            };

            if (option === 'research') {
                const results = await performResearch(products[0].name, featureSet);
                setResearch(results);
            } else {
                const results = await performMultiProductResearch(products, featureSet);
                setResearch(results);
            }
            setStep(5);
        } catch (error) {
            console.error(error);
            toast({
                title: "Research Failed",
                description: "An error occurred during the research process.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 1.25) {
            setStep(1);
        } else if (step === 1.5) {
            setStep(1);  // back to step 1 directly
        } else if (step === 2) {
            setStep(1);
        } else if (step === 3) {
            if (option === 'recommend') setStep(2);
            else if (option === 'compare') setStep(1.5);
            else setStep(1.5);
        } else if (step === 5) {
            if (option === 'research') {
                setStep(1.5);
            } else {
                setStep(3);
            }
            setResearch(null);
        } else if (step === 6) {
            setStep(1);
            setInput("");
        } else if (step === 6.5) {
            setStep(6);
            setSeveralResults(null);
            setInput("");
        }
    };

    return createPortal(
        <>
            <div
                className="fixed bottom-24 right-4 md:bottom-8 md:right-6 cursor-pointer group"
                style={{ position: 'fixed', zIndex: 99999 }}
                onClick={() => setOpen(true)}
            >
                <div
                    className="flex items-center gap-3 bg-white rounded-full p-1.5 md:pl-4 md:pr-2 md:py-2 shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                    style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)' }}
                >
                    <span className="hidden md:inline text-gray-700 font-semibold text-sm whitespace-nowrap">
                        Ask <span className="text-brand-purple">Owl AI</span>
                    </span>
                    <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-brand-purple flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                </div>
            </div>

            {open && (
                <>
                    <div
                        className="fixed inset-0 bg-black/30 z-[99997] md:hidden"
                        onClick={() => { setOpen(false); resetState(); }}
                    />
                    <div
                        className="fixed bottom-36 left-4 right-4 md:bottom-24 md:left-auto md:right-6 md:w-[420px] max-h-[60vh] md:max-h-[70vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden z-[99998] animate-in fade-in slide-in-from-bottom-4 duration-300"
                        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}
                    >
                        <div className="bg-brand-purple px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="h-5 w-5 text-white" />
                                <h2 className="text-white font-semibold">Owl AI Assistant</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {step > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetState}
                                        className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-2"
                                    >
                                        Reset
                                    </Button>
                                )}
                                <button
                                    onClick={() => { setOpen(false); resetState(); }}
                                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[calc(70vh-56px)]">
                            {step === 1 && <StepOne onOptionSelect={handleMainOptionSelect} />}

                            {step === 1.25 && (
                                <StepOnePointTwoFive
                                    onResearchTypeSelect={handleResearchTypeSelect}
                                    onMainOptionSelect={handleMainOptionSelect}
                                    onBack={handleBack}
                                />
                            )}

                            {step === 1.5 && (
                                <StepOnePointFive
                                    input={input}
                                    loading={loading}
                                    onInputChange={setInput}
                                    onOptionSelect={(opt) => handleOptionSelect(opt)}
                                    onBack={handleBack}
                                    researchType={researchType}
                                    userPreferences={userPreferences}
                                    onUserPreferencesChange={setUserPreferences}
                                />
                            )}

                            {step === 2 && (
                                <StepTwo
                                    option={option}
                                    input={input}
                                    loading={loading}
                                    onInputChange={setInput}
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleOptionSelect(option);
                                    }}
                                    onBack={handleBack}
                                />
                            )}

                            {step === 3 && (
                                <StepThree
                                    products={products}
                                    newFeature={newFeature}
                                    option={option}
                                    onNewFeatureChange={setNewFeature}
                                    onAddFeature={() => { }}
                                    onImportanceChange={(pIdx, fId, imp) => {
                                        const newProducts = [...products];
                                        const feature = newProducts[pIdx].features.find(f => f.id === fId);
                                        if (feature) feature.importance = imp;
                                        setProducts(newProducts);
                                    }}
                                    onBack={handleBack}
                                    onContinue={() => { handleStartResearch(); }}
                                    loading={loading}
                                    onProductsChange={setProducts}
                                />
                            )}

                            {step === 5 && research && (
                                <StepFive research={research} onBack={handleBack} />
                            )}

                            {step === 6 && (
                                <StepSeveralInput
                                    input={input}
                                    loading={loading}
                                    onInputChange={setInput}
                                    onSubmit={handleSeveralSubmit}
                                    onBack={handleBack}
                                />
                            )}

                            {step === 6.5 && severalResults && (
                                <StepSeveralResults
                                    results={severalResults}
                                    query={severalQuery}
                                    onBack={handleBack}
                                />
                            )}

                            <div className="mt-4 flex justify-center">
                                <ErrorDialog logs={getApiLogs()} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>,
        document.body
    );
}