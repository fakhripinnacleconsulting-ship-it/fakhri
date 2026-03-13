"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Shared CartDropdown component used in both public website header and client dashboard.
 * 
 * @param {Object} props
 * @param {"public" | "dashboard"} props.variant - "public" shows total amount in trigger & checkout button; "dashboard" shows compact trigger & request quote button.
 * @param {string} props.emptyMessage - Custom empty cart message.
 */
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CartDropdown({ variant = "dashboard", emptyMessage }) {
    const { data: session } = useSession();
    const router = useRouter();
    const { cartItems, removeFromCart, updateQuantity, totalItems, totalAmount } = useCart();

    const isPublic = variant === "public";

    const handleCheckout = () => {
        const url = !session ? '/login?role=client&callbackUrl=/checkout' : '/checkout';

        if (!isPublic) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            if (session && session.user.role !== 'client') {
                toast.error("Administrators cannot purchase plans or services. Please use a client account.");
                return;
            }
            router.push(url);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`relative flex items-center gap-2 ${isPublic ? 'px-3' : 'px-2'}`}>
                    <div className="relative">
                        <ShoppingCart className="h-5 w-5" />
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center border-2 border-background">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    {isPublic && totalAmount > 0 && (
                        <span className="text-sm font-medium hidden xl:inline-block">
                            ₹{formatINR(totalAmount)}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <h4 className="font-semibold">Shopping Cart</h4>
                    <p className="text-sm text-muted-foreground">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                </div>

                {/* Items */}
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Your cart is empty</p>
                            {emptyMessage && (
                                <p className="text-xs mt-1">{emptyMessage}</p>
                            )}
                            {!emptyMessage && !isPublic && (
                                <p className="text-xs mt-1">Add services from the &quot;My Plan&quot; tab</p>
                            )}
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="flex gap-3">
                                <div className="flex-1 space-y-1">
                                    <h5 className="text-sm font-medium leading-none">{item.name}</h5>
                                    <p className="text-xs text-muted-foreground">{item.category}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center border border-input rounded-md h-7">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    updateQuantity(item.id, item.quantity - 1);
                                                }}
                                                className="px-2 hover:bg-accent h-full flex items-center"
                                            >
                                                -
                                            </button>
                                            <span className="px-2 text-xs font-medium border-x border-input h-full flex items-center bg-accent/50">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    updateQuantity(item.id, item.quantity + 1);
                                                }}
                                                className="px-2 hover:bg-accent h-full flex items-center"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeFromCart(item.id);
                                            }}
                                            className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">₹{formatINR(item.price * item.quantity)}</p>
                                    <p className="text-xs text-muted-foreground">₹{formatINR(item.price)} ea</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-4 border-t border-border bg-muted/20">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-medium">Total</span>
                            <span className="text-lg font-bold text-primary">₹{formatINR(totalAmount)}</span>
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleCheckout}
                        >
                            Checkout
                        </Button>
                    </div>
                )}

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
