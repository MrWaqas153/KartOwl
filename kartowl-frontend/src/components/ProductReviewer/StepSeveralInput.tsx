import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Loader2 } from "lucide-react";

interface StepSeveralInputProps {
    input: string;
    loading: boolean;
    onInputChange: (val: string) => void;
    onSubmit: () => void;
    onBack: () => void;
}

export function StepSeveralInput({
    input,
    loading,
    onInputChange,
    onSubmit,
    onBack,
}: StepSeveralInputProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <p className="text-center text-lg text-muted-foreground">
                What are you looking for?
            </p>

            <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700 border border-purple-100">
                💡 <span className="font-medium">Examples:</span> "mobiles under 50000 PKR", "budget laptops for students", "wireless earbuds under 5000"
            </div>

            <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all"
                rows={3}
                placeholder="e.g. best mobiles under 50000 PKR..."
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                        e.preventDefault();
                        onSubmit();
                    }
                }}
                disabled={loading}
            />

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    disabled={loading}
                    className="flex items-center gap-1"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                </Button>
                <Button
                    size="sm"
                    onClick={onSubmit}
                    disabled={loading || !input.trim()}
                    className="flex-1 bg-brand-purple hover:bg-brand-purple/90 text-white flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Finding products...
                        </>
                    ) : (
                        <>
                            <Search className="h-3.5 w-3.5" />
                            Find Best Products
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}