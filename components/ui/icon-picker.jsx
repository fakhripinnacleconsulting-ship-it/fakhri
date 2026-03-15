"use client";

import { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Exclude components that aren't icons or are internal
const EXCLUDED_KEYS = ["createLucideIcon", "LucideProps", "LucideIcon", "default"];
const ICON_NAMES = Object.keys(LucideIcons).filter(
    (key) => !EXCLUDED_KEYS.includes(key) && (typeof LucideIcons[key] === "function" || typeof LucideIcons[key] === "object")
);

export function IconPicker({ value, onChange, placeholder = "Select icon..." }) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredIcons = useMemo(() => {
        if (!searchQuery) return ICON_NAMES.slice(0, 50); // Initial set
        return ICON_NAMES.filter((name) =>
            name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 50); // Limit results for performance
    }, [searchQuery]);

    const Icon = value && LucideIcons[value] ? LucideIcons[value] : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {Icon ? (
                            <Icon className="h-4 w-4 shrink-0" />
                        ) : (
                            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{value || placeholder}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput 
                        placeholder="Search icons..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        <CommandEmpty>No icon found.</CommandEmpty>
                        <CommandGroup>
                            {filteredIcons.map((iconName) => {
                                const ItemIcon = LucideIcons[iconName];
                                if (!ItemIcon) return null;
                                return (
                                    <CommandItem
                                        key={iconName}
                                        value={iconName}
                                        onSelect={() => {
                                            onChange(iconName);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="flex items-center justify-center w-6 h-6 rounded bg-muted">
                                                <ItemIcon className="h-4 w-4" />
                                            </div>
                                            <span className="flex-1 truncate">{iconName}</span>
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 shrink-0",
                                                    value === iconName ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
