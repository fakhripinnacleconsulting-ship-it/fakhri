"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Link as LinkIcon, Upload as UploadIcon, X, Trash2 } from "lucide-react";

export function ImagePicker({ name, label, value: initialValue, onChange, className }) {
    const [mode, setMode] = useState("link"); // "link" | "upload"
    const [value, setValue] = useState(initialValue || "");
    const fileInputRef = useRef(null);

    useEffect(() => {
        setValue(initialValue || "");
    }, [initialValue]);

    const handleValueChange = (newValue) => {
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleValueChange(reader.result);
            };
            reader.readAsDataURL(file);
            // In future: Add Vercel Blob upload logic here
        }
    };

    const clearImage = () => {
        handleValueChange("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className={`space-y-3 p-4 border rounded-lg bg-card/50 ${className}`}>
            <div className="flex items-center justify-between">
                <Label className="font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    {label || "Image"}
                </Label>
                <Tabs value={mode} onValueChange={setMode} className="w-[180px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="link" className="text-xs flex gap-1 items-center justify-center">
                            <LinkIcon className="w-3 h-3" /> Link
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="text-xs flex gap-1 items-center justify-center">
                            <UploadIcon className="w-3 h-3" /> Upload
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Hidden input to ensure FormData picks up the value */}
            <input type="hidden" name={name} value={value} />

            <div className="space-y-3">
                {mode === "link" ? (
                    <Input
                        placeholder="https://example.com/image.jpg"
                        value={value}
                        onChange={(e) => handleValueChange(e.target.value)}
                        className="bg-background"
                    />
                ) : (
                    <div className="flex gap-2">
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="bg-background file:text-foreground"
                        />
                    </div>
                )}

                {value && (
                    <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-dashed border-primary/20 group relative">
                        <div className="relative h-20 w-32 rounded-lg overflow-hidden border shadow-sm flex-shrink-0 bg-background">
                            <img
                                src={value}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/100x100?text=Invalid+Image";
                                }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shadow-lg"
                                    onClick={clearImage}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                            <p className="text-xs font-bold truncate text-primary uppercase tracking-wider mb-1">Current Image</p>
                            <p className="text-[10px] text-muted-foreground truncate opacity-70">
                                {value.startsWith('data:') ? 'Local preview data' : value}
                            </p>
                            <button
                                type="button"
                                onClick={clearImage}
                                className="text-[10px] text-destructive font-bold uppercase mt-2 hover:underline flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" /> Remove Image
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
