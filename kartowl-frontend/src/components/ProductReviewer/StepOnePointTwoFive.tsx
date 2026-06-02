import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResearchType, MainOption } from "@/types/product";
import { Search, ListFilter } from "lucide-react";

interface StepOnePointTwoFiveProps {
    onResearchTypeSelect: (type: ResearchType) => void;
    onMainOptionSelect: (option: MainOption) => void;
    onBack: () => void;
}

export function StepOnePointTwoFive({ onResearchTypeSelect, onMainOptionSelect, onBack }: StepOnePointTwoFiveProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <p className="text-center text-lg text-muted-foreground">
                How many products do you want to research?
            </p>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2">
                    <Button
                        size="lg"
                        className="w-full flex items-center justify-center"
                        onClick={() => onResearchTypeSelect('single')}
                    >
                        <Search className="mr-2 h-5 w-5" />
                        1 product
                    </Button>
                    <span className="text-sm text-muted-foreground">I know what I want</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Button
                        size="lg"
                        className="w-full flex items-center justify-center"
                        onClick={() => onMainOptionSelect('several')}
                    >
                        <ListFilter className="mr-2 h-5 w-5" />
                        Several products
                    </Button>
                    <span className="text-sm text-muted-foreground">I want to compare them</span>
                </div>
            </div>
            <div className="flex justify-start">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>
        </div>
    );
}