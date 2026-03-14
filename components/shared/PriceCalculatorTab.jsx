
"use client";

import { Calculator, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PriceCalculatorTab() {
    const calculatorUrl = "https://sellercentral.amazon.in/revcal";

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold font-heading">Price Calculator</h2>
                <p className="text-muted-foreground mt-1">Calculate your Amazon product pricing, fees, and margins.</p>
            </div>

            <div className="bg-card rounded-2xl border p-8 md:p-12 flex flex-col items-center text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Calculator className="h-8 w-8 text-primary" />
                </div>

                <h3 className="text-xl font-heading font-semibold mb-2">Amazon Revenue Calculator</h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                    Use Amazon Seller Central's official Revenue Calculator to estimate your product fees, margins, and profitability.
                </p>

                <Button size="lg" className="font-semibold px-8" asChild>
                    <a href={calculatorUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Open Price Calculator
                    </a>
                </Button>

                <p className="text-xs text-muted-foreground mt-4">
                    Opens Amazon Seller Central in a new tab. You may need to sign in with your Amazon seller account.
                </p>
            </div>
        </div>
    );
}
