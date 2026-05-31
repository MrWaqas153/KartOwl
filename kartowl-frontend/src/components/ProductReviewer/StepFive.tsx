import { ArrowLeft, CheckCircle2, XCircle, Cpu, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResearchResults, ReviewResult } from "@/types/product";

interface StepFiveProps {
    research: ResearchResults | ReviewResult;
    onBack: () => void;
}

export function StepFive({ research, onBack }: StepFiveProps) {
    const isReview = (r: any): r is ReviewResult => 'verdict' in r && 'matchScore' in r;

    if (isReview(research)) {
        const isRecommended = research.verdict === "Recommended";

        return (
            <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-500">
                
                {/* Product Name + Verdict */}
                <div className={`border-2 ${isRecommended ? 'border-green-500/30 bg-green-50/50' : 'border-red-500/30 bg-red-50/50'} p-4 rounded-2xl relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isRecommended ? 'via-green-500' : 'via-red-500'} to-transparent`} />
                    
                    <div className="flex items-center gap-3 mb-2">
                        {isRecommended ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                        ) : (
                            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                        )}
                        <h2 className="text-lg font-bold text-foreground">
                            {research.productName}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 ml-9">
                        <span className={`text-2xl font-black ${isRecommended ? 'text-green-500' : 'text-red-500'}`}>
                            {research.matchScore}%
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                            Match
                        </span>
                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${isRecommended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {research.verdict}
                        </span>
                    </div>
                </div>

                {/* Specs */}
                {(research as any).specs && (research as any).specs.length > 0 && (
                    <div className="border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Cpu className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Key Specs</h3>
                        </div>
                        <ul className="flex flex-col gap-2">
                            {(research as any).specs.map((spec: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary font-bold mt-0.5">•</span>
                                    {spec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* User Reviews Summary */}
                <div className="border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">User Reviews</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {research.explanation}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-2">
                    <Button variant="outline" onClick={onBack} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Button onClick={() => window.location.reload()} className="flex-1">
                        Start Over
                    </Button>
                </div>
            </div>
        );
    }

    // Existing Logic for ResearchResults
    let finalText = "";
    if (research.comparisonReport) {
        try {
            const parsed = JSON.parse(research.comparisonReport);
            finalText = parsed.verdict || parsed.conclusion || "Recommendation ready.";
        } catch {
            finalText = research.comparisonReport;
        }
    } else if (research.reports.length > 0) {
        finalText = research.reports[0].finalReport;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in-95 duration-500">
            <div className="bg-card border-2 border-primary/20 p-8 rounded-2xl shadow-xl max-w-2xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                    The Verdict
                </h2>
                <p className="text-lg sm:text-xl leading-relaxed text-muted-foreground font-medium">
                    "{finalText}"
                </p>
            </div>
            <div className="mt-8 flex gap-4">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Button onClick={() => window.location.reload()}>
                    Start Over
                </Button>
            </div>
        </div>
    );
}