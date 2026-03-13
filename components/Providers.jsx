"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useState } from "react";
import SmoothScrollProvider from "@/components/ui/SmoothScrollProvider";

import { AuthProvider } from "@/context/AuthProvider";
import { CartProvider } from "@/context/CartContext";

export default function Providers({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30 * 1000, // 30 seconds
                gcTime: 5 * 60 * 1000, // 5 minutes
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <CartProvider>
                    <TooltipProvider>
                        <SmoothScrollProvider>
                            {children}
                            <Sonner ghost={false} />
                        </SmoothScrollProvider>
                    </TooltipProvider>
                </CartProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

