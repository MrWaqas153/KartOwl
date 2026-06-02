import { Button } from "@/components/ui/button";
import type { MainOption } from "@/types/product";
import { Search, HelpCircle } from "lucide-react";

interface StepOneProps {
    onOptionSelect: (option: MainOption) => void;
}

export function StepOne({ onOptionSelect }: StepOneProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <p className="text-center text-lg text-muted-foreground">
                Do you know what product you want to buy?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    size="lg"
                    className="w-full flex items-center justify-center"
                    onClick={() => onOptionSelect('known')}
                >
                    <Search className="mr-2 h-5 w-5" />
                    Yes!
                </Button>
                <Button
                    size="lg"
                    className="w-full flex items-center justify-center"
                    onClick={() => onOptionSelect('unknown')}
                >
                    <HelpCircle className="mr-2 h-5 w-5" />
                    No, help me research
                </Button>
            </div>
        </div>
    );
}