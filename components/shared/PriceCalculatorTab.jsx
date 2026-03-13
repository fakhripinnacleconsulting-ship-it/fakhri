
"use client";

import { Card } from "@/components/ui/card";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PriceCalculatorTab() {
    const [loading, setLoading] = useState(true);
    const iframeUrl = "https://sellercentral.amazon.in/ap/signin?clientContext=258-4736134-1745033&openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fsellercentral.amazon.in%2Frevcal&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=sc_in_amazon_v2&openid.mode=checkid_setup&language=en_IN&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&pageId=sc_amazon_v3_unified&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&ssoResponse=eyJ6aXAiOiJERUYiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiQTI1NktXIn0.U1mEZbEa4Ih6akVnTdXQlsDqlB_oq-eYB8TeJ4MpVQUyzf6tkEmkLA.nDF-jK7LD4IsgPX3.q94z7GcTQLL0RddW8fCVGuPU0bTB3sgJ38SI0PWSIFmKuYoDglOxAknG5C-DWNl7P3otY80xjiz5Ld6u8J9aHw74nSsqxCWqUgy0HW6DkuRrnmFMUnaggRUYEhwNssd_n_EhkW7VIUDzBZ1ym0-nVfOS_kII4A19ULPtyUx4hv4gTHBsAopjQlbMKoT0uf8ke586ZMa7nQ.szTNIGD3g4ftzts_rP7z9Q";

    const handleRefresh = () => {
        setLoading(true);
        const iframe = document.getElementById("price-calculator-iframe");
        if (iframe) {
            iframe.src = iframeUrl;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-heading">Price Calculator</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <a href={iframeUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in New Tab
                        </a>
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-xl bg-white relative h-[calc(100vh-200px)] min-h-[600px]">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 transition-opacity">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                        <p className="text-muted-foreground animate-pulse">Connecting to Amazon price calculator...</p>
                        <p className="text-[10px] text-muted-foreground mt-4 max-w-xs text-center px-4">
                            Note: Amazon may block loading this page in an iframe for security reasons. If the page doesn't load, use the "Open in New Tab" button.
                        </p>
                    </div>
                )}
                <iframe
                    id="price-calculator-iframe"
                    src={iframeUrl}
                    className="w-full h-full border-none"
                    onLoad={() => setLoading(false)}
                    sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin"
                    title="Amazon price calculator"
                />
            </Card>
        </div>
    );
}
