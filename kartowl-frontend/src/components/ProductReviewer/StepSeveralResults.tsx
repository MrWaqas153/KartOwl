import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import type { SeveralProductResult } from "@/types/product";

interface StepSeveralResultsProps {
    results: SeveralProductResult[];
    query: string;
    onBack: () => void;
}

export function StepSeveralResults({ results, query, onBack }: StepSeveralResultsProps) {
    const topProduct = results.reduce((best, p) => p.score > best.score ? p : best, results[0]);

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-1">
                <div>
                    <p className="font-semibold text-gray-800 text-sm">Top 4 Results</p>
                    <p className="text-xs text-gray-500 truncate max-w-[220px]">"{query}"</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    {results.length} products
                </span>
            </div>

            <div className="space-y-3">
                {results.map((product, idx) => {
                    const isTop = product.name === topProduct.name;
                    return (
                        <div
                            key={idx}
                            className={`rounded-xl border p-3 transition-all ${
                                isTop
                                    ? 'border-brand-purple bg-purple-50/60 shadow-sm'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    {isTop && (
                                        <Trophy className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                                    )}
                                    <span className="font-semibold text-gray-900 text-sm leading-tight">
                                        {product.name}
                                    </span>
                                </div>
                                <div className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                                    product.score >= 85
                                        ? 'bg-green-100 text-green-700'
                                        : product.score >= 70
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {product.score}/100
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1 mb-2.5">
                                {product.specs.map((spec, sIdx) => (
                                    <div key={sIdx} className="flex items-start gap-1.5 bg-white/80 rounded-lg px-2 py-1.5 border border-gray-100">
                                        <span className="text-base leading-none mt-0.5">{spec.icon}</span>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">
                                                {spec.label}
                                            </p>
                                            <p className="text-xs text-gray-700 font-medium leading-tight">
                                                {spec.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`rounded-lg px-2.5 py-2 text-xs ${
                                isTop ? 'bg-white/70 border border-purple-100' : 'bg-gray-50 border border-gray-100'
                            }`}>
                                <span className="text-gray-400 mr-1">💬</span>
                                <span className="text-gray-600 italic">{product.review}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-1 w-full"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Search Again
            </Button>
        </div>
    );
}