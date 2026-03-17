"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import WhatsAppButton from "@/components/client/WhatsAppButton";
import { Mail, ArrowRight, Star } from "lucide-react";

export const NoPlanState = ({ title, message, hideWhatsApp = false }) => {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-6 animate-in fade-in-50">
            <div className="bg-primary/10 p-4 rounded-full">
                <Star className="h-8 w-8 text-primary fill-current" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl font-bold font-heading">{title || "Welcome to Fakhri IT Services"}</h2>
                <p className="text-muted-foreground">
                    {message || "To get started, please check out our pricing plans or contact us for assistance."}
                </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 w-full max-w-md">
                <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => window.open('/pricing', '_blank', 'noopener,noreferrer')}
                >
                    View Pricing Plans <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => window.open('/contact', '_blank', 'noopener,noreferrer')}
                >
                    Contact Support <Mail className="h-4 w-4" />
                </Button>
            </div>

            {!hideWhatsApp && (
                <div className="pt-4">
                    <p className="text-xs text-muted-foreground mb-3">Or chat with us directly</p>
                    <div className="inline-block" style={{ transform: 'none' }}>
                        <a
                            href="https://wa.me/918982675004"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#25D366] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-[#128C7E] transition-all flex items-center gap-2"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.248-.57-.397m-5.473 7.825h.001c-1.933 0-3.832-.524-5.503-1.516l-.395-.234-4.09 1.071 1.092-3.987-.256-.408c-1.08-1.714-1.649-3.71-1.649-5.748 0-5.968 4.856-10.835 10.833-10.835 2.895 0 5.618 1.127 7.665 3.174 2.046 2.049 3.171 4.773 3.171 7.67 0 5.967-4.858 10.834-10.835 10.835zm0-20.088c-5.101 0-9.253 4.152-9.253 9.253 0 1.631.425 3.194 1.233 4.56l-1.309 4.777 4.896-1.283c1.336.729 2.845 1.113 4.433 1.113 5.101 0 9.255-4.151 9.255-9.253 0-5.102-4.154-9.254-9.255-9.254z" />
                            </svg>
                            WhatsApp Us
                        </a>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">8982675004</p>
                    </div>
                </div>
            )}
        </div>
    );
};
