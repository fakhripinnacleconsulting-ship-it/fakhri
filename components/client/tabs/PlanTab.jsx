"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Star, Plus, Minus, Calculator, Loader2, Package, Trash2, BadgeCheck, MessageSquare, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPricingPlans, getCatalogServices } from "@/lib/actions/content";
import { addClientSubscribedServices } from "@/lib/actions/user";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { PricingCard } from "@/components/ui/PricingCard";
import { useRouter } from "next/navigation";
import { calculatePeriodDays, parsePlanPrice, calculateUpgradeDiscount } from "@/lib/utils";
import Link from "next/link";

const ClientPlanTab = ({ currentUser, managerPhone, managerName }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState("plan");
    const [client, setClient] = useState(null);
    const [allPlans, setAllPlans] = useState([]);
    const [catalogServices, setCatalogServices] = useState([]);
    const [quantities, setQuantities] = useState({});

    const { cartItems, addToCart, removeFromCart, updateQuantity, totalItems, totalAmount, clearCart } = useCart();

    useEffect(() => {
        const loadPlanData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                setClient(currentUser);

                const plansData = await getPricingPlans();
                setAllPlans(plansData);

                const servicesData = await getCatalogServices();
                setCatalogServices(servicesData);

                // Initialize quantities for all services
                const initialQuantities = {};
                servicesData.forEach(s => {
                    initialQuantities[s.serviceId || s._id] = 1;
                });
                setQuantities(initialQuantities);
            } catch (error) {
                console.error("Error loading plan data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPlanData();
    }, [currentUser]);

    // Find current plan details
    const currentPlan = useMemo(() => {
        if (!client || !allPlans.length) return null;
        return allPlans.find(p =>
            p.name?.toLowerCase() === client.plan?.toLowerCase() ||
            p.planId?.toLowerCase() === client.plan?.toLowerCase() ||
            p._id === client.plan
        );
    }, [client, allPlans]);

    // Calculate upgrade info: discount + higher-value plans
    const upgradeInfo = useMemo(() => {
        if (!client || !currentPlan || !allPlans.length) return null;

        const currentPrice = parsePlanPrice(currentPlan.prices?.monthly);
        const hasActiveSubscription = client.subscriptionEnd && new Date(client.subscriptionEnd) > new Date();

        if (!hasActiveSubscription) return null;

        // Calculate the 75% remaining value discount
        const discountInfo = calculateUpgradeDiscount({
            subscriptionStart: client.subscriptionStart,
            subscriptionEnd: client.subscriptionEnd,
            currentPlanPrice: currentPrice
        });

        // Filter plans that are higher in value than the current plan
        const higherPlans = allPlans.filter(p => {
            const planPrice = parsePlanPrice(p.prices?.monthly);
            const planId = p.planId || p._id;
            const currentPlanId = currentPlan.planId || currentPlan._id;
            return planPrice > currentPrice && planId !== currentPlanId;
        });

        return {
            discountInfo,
            higherPlans,
            currentPrice,
            currentPlanId: currentPlan.planId || currentPlan._id
        };
    }, [client, currentPlan, allPlans]);

    // Get subscribed service IDs
    const subscribedServiceIds = useMemo(() => {
        if (!client?.subscribedServices) return new Set();
        return new Set(
            client.subscribedServices
                .filter(s => s.status === 'active')
                .map(s => s.serviceId)
        );
    }, [client]);

    // Filter add-on services: only show services client hasn't subscribed to
    const availableAddOnServices = useMemo(() => {
        const services = [];
        catalogServices.forEach(s => {
            if (!subscribedServiceIds.has(s.serviceId)) {
                // Add standard if it exists and has a price
                if (s.pricing?.standard?.price > 0) {
                    services.push({
                        id: `${s.serviceId}-standard`,
                        serviceId: s.serviceId,
                        name: s.name,
                        category: s.category,
                        price: s.pricing.standard.price,
                        priceLabel: s.pricing.standard.label || "",
                        type: 'standard',
                        hsnCode: s.hsnCode || '998311'
                    });
                }
                // Add priority if it exists and has a price
                if (s.pricing?.priority?.price > 0) {
                    services.push({
                        id: `${s.serviceId}-priority`,
                        serviceId: s.serviceId,
                        name: `${s.name} (Priority)`,
                        category: s.category,
                        price: s.pricing.priority.price,
                        priceLabel: s.pricing.priority.label || "",
                        type: 'priority',
                        hsnCode: s.hsnCode || '998311'
                    });
                }
            }
        });
        return services;
    }, [catalogServices, subscribedServiceIds]);

    // Already subscribed services
    const subscribedServices = useMemo(() => {
        if (!client?.subscribedServices) return [];
        return client.subscribedServices.filter(s => s.status === 'active');
    }, [client]);

    // Quantity handlers
    const handleIncrement = (id) => {
        setQuantities(prev => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
    };

    const handleDecrement = (id) => {
        setQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) - 1) }));
    };

    const handleAddToCart = (service) => {
        const quantity = quantities[service.id] || 1;
        addToCart({
            id: service.id,
            serviceId: service.serviceId,
            name: service.name,
            price: service.price,
            category: service.category,
            quantity: quantity,
            type: service.type,
            hsnCode: service.hsnCode || '998311'
        });
        // Reset quantity to 1 after adding
        setQuantities(prev => ({ ...prev, [service.id]: 1 }));
        toast.success(`${service.name} added to cart`);
    };

    const handleCheckout = async () => {
        if (!client || cartItems.length === 0) return;

        setLoading(true);
        try {
            const servicesToSubscribe = cartItems.map(item => ({
                serviceId: item.serviceId, // Original ID from DB
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity,
                type: item.type || 'standard'
            }));

            const result = await addClientSubscribedServices(client._id, servicesToSubscribe);

            if (result.success) {
                toast.success("Services subscribed successfully!");
                clearCart();
                // In a real app, we'd trigger a re-fetch of user data here
                // For now, we manually update the local client state
                setClient(prev => ({
                    ...prev,
                    subscribedServices: [
                        ...(prev.subscribedServices || []),
                        ...servicesToSubscribe.map(s => ({ ...s, status: 'active', subscribedDate: new Date() }))
                    ]
                }));
                setActiveSubTab("plan"); // Switch to plan tab to see active services
            } else {
                toast.error(result.error || "Failed to subscribe");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("An error occurred during checkout");
        } finally {
            setLoading(false);
        }
    };

    // Check if a service is already in cart
    const isInCart = (serviceId) => {
        return cartItems.some(item => item.id === serviceId);
    };

    // Format price
    const formatPrice = (price) => {
        if (!price) return "Custom";
        return new Intl.NumberFormat('en-IN').format(price);
    };

    // Dates & Expiry Calculation
    // Use subscriptionEnd from DB if available, otherwise fallback to old calculation
    const purchaseDate = client?.subscriptionStart ? new Date(client.subscriptionStart) : (client?.joinedDate ? new Date(client.joinedDate) : new Date());

    let expiryDate;
    if (client?.subscriptionEnd) {
        expiryDate = new Date(client.subscriptionEnd);
    } else {
        // Fallback calculation
        const planDays = calculatePeriodDays(currentPlan?.period);
        expiryDate = new Date(purchaseDate);
        expiryDate.setDate(expiryDate.getDate() + planDays);
    }

    const today = new Date();
    const isExpired = today > expiryDate;
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    const startDateStr = purchaseDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const validUntilStr = expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading plan details...</p>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="bg-card rounded-xl border p-12 text-center">
                <h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
                <p className="text-muted-foreground">We couldn't load your plan details. Please contact support.</p>
            </div>
        );
    }

    // SCENARIO 1: No Plan Assigned
    if (!client.plan || client.plan.toLowerCase() === "none") {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="font-heading text-2xl font-bold mb-2">My Plan</h1>
                    <p className="text-muted-foreground">Choose a plan or manage your active services.</p>
                </div>

                {/* Subscribed Add-on Services (Show these even without a plan) */}
                {subscribedServices.length > 0 && (
                    <div className="bg-card rounded-xl border p-6">
                        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                            <BadgeCheck className="h-5 w-5 text-primary" />
                            Active Add-on Services
                        </h3>
                        <div className="grid md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {subscribedServices.map((service, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{service.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Since {new Date(service.subscribedDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-primary border-primary/30 text-xs">Active</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-4">
                    <div className="mb-6">
                        <h2 className="font-heading text-xl font-bold mb-2">Purchase a Plan or <a href="/pricing" target="_blank" rel="noopener noreferrer" className="text-primary underline">See Pricing Details</a></h2>
                        <p className="text-muted-foreground">You currently don't have an active main plan. Please select one to get full access.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allPlans.map((plan, index) => (
                            <PricingCard key={plan._id || index} plan={plan} index={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-2xl font-bold mb-2">My Plan</h1>
                <p className="text-muted-foreground">View your current plan details and validity.</p>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex gap-2 p-1 bg-accent/50 rounded-lg w-fit">
                <button
                    onClick={() => setActiveSubTab("plan")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === "plan"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Current Plan
                </button>
                <button
                    onClick={() => setActiveSubTab("addons")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeSubTab === "addons"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Plus className="h-4 w-4" />
                    Add-on Services
                    {totalItems > 0 && (
                        <span className="ml-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                            {totalItems}
                        </span>
                    )}
                </button>
            </div>

            {/* Current Plan Tab Content */}
            {activeSubTab === "plan" && (
                <>
                    {/* Expiry Alert */}
                    {isExpired && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-destructive text-destructive-foreground rounded-full">
                                    <BadgeCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-destructive">Plan Expired</h3>
                                    <p className="text-sm text-muted-foreground">Your {client.plan} plan expired on {validUntilStr}.</p>
                                </div>
                            </div>
                            <Button onClick={() => window.open(`/checkout?plan=${currentPlan.planId || currentPlan._id || currentPlan.id}`, '_blank', 'noopener,noreferrer')}>
                                Renew Plan
                            </Button>
                        </div>
                    )}

                    {/* Subscribed Add-on Services - Moved to top */}
                    {subscribedServices.length > 0 && (
                        <div className="bg-card rounded-xl border p-6 mb-6">
                            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                                <BadgeCheck className="h-5 w-5 text-primary" />
                                Active Add-on Services
                            </h3>
                            <div className="grid md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {subscribedServices.map((service, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{service.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Since {new Date(service.subscribedDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-primary border-primary/30 text-xs">Active</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Current Plan Card */}
                    <div className="bg-card rounded-xl border overflow-hidden">
                        <div className={`p-6 ${isExpired ? 'bg-gray-100 text-gray-800' : 'bg-gradient-primary text-white'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Badge className={`${isExpired ? 'bg-gray-300 text-gray-700' : 'bg-white/20 text-white'} mb-2`}>
                                        {isExpired ? "Expired Plan" : "Current Plan"}
                                    </Badge>
                                    <h2 className="font-heading text-3xl font-bold uppercase">{currentPlan?.name || client.plan || "No Plan"}</h2>
                                    <p className={`${isExpired ? 'text-gray-600' : 'text-white/80'} mt-1`}>
                                        {currentPlan?.prices?.monthly || "0"} {currentPlan?.period || "/ month"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {isExpired ? (
                                        <div className="flex items-center gap-1 text-gray-400 mb-2">
                                            <Badge variant="outline" className="border-gray-400 text-gray-500">Expired</Badge>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-yellow-300 mb-2">
                                            {[1, 2, 3, 4, 5].map((i) => (<Star key={i} className="h-4 w-4 fill-current" />))}
                                        </div>
                                    )}
                                    <p className={`text-sm ${isExpired ? 'text-gray-500' : 'text-white/80'}`}>{currentPlan?.isPopular ? "Most Popular" : "Active Plan"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded-lg bg-accent/50">
                                    <p className="text-sm text-muted-foreground">Start Date</p>
                                    <p className="font-semibold">{startDateStr}</p>
                                </div>
                                <div className={`p-4 rounded-lg ${isExpired ? 'bg-destructive/10' : 'bg-accent/50'}`}>
                                    <p className="text-sm text-muted-foreground">Valid Until</p>
                                    <p className={`font-semibold ${isExpired ? 'text-destructive' : ''}`}>{validUntilStr}</p>
                                    {!isExpired && <p className="text-xs text-primary font-medium mt-1">{daysLeft} days left</p>}
                                </div>
                                {/* <div className="p-4 rounded-lg bg-accent/50">
                                    <p className="text-sm text-muted-foreground">Account Status</p>
                                    <p className={`font-semibold capitalize ${client.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>{client.status || "Active"}</p>
                                </div> */}
                            </div>

                            <h3 className="font-heading font-semibold mb-4">Included Services</h3>
                            <div className="space-y-3">
                                {currentPlan?.features?.length > 0 ? (
                                    currentPlan.features.map((feature, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className={`h-4 w-4 ${isExpired ? 'text-gray-400' : 'text-primary'}`} />
                                                <span className={isExpired ? 'text-muted-foreground' : ''}>{feature.text}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Contact support for list of included services.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* If Expired, show Purchase Plan section */}
                    {isExpired && (
                        <div className="space-y-6 pt-6">
                            <div>
                                <h2 className="font-heading text-xl font-bold mb-2">Purchase Plan</h2>
                                <p className="text-muted-foreground">Your plan has expired. Choose a new plan to continue enjoying our services.</p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {allPlans.map((plan, index) => (
                                    <PricingCard key={plan._id || index} plan={plan} index={index} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* If Active, show Upgrade Plan section (only higher-value plans with discount) */}
                    {!isExpired && upgradeInfo && upgradeInfo.higherPlans.length > 0 && (
                        <div className="space-y-6 pt-6">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                        <ArrowUpCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="font-heading text-xl font-bold mb-1">Upgrade Plan</h2>
                                        <p className="text-muted-foreground text-sm">
                                            Upgrade to a higher plan and get <span className="font-semibold text-green-600">75% of your remaining plan value</span> as a discount!
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                                            <span className="bg-white dark:bg-card px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 font-medium">
                                                Remaining: {upgradeInfo.discountInfo.remainingDays} days
                                            </span>
                                            <span className="bg-white dark:bg-card px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 font-medium">
                                                Remaining Value: ₹{upgradeInfo.discountInfo.remainingValue.toLocaleString('en-IN')}
                                            </span>
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full font-semibold">
                                                Upgrade Discount: ₹{upgradeInfo.discountInfo.discount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upgradeInfo.higherPlans.map((plan, index) => (
                                    <PricingCard
                                        key={plan._id || index}
                                        plan={plan}
                                        index={index}
                                        upgradeMode={true}
                                        upgradeDiscount={upgradeInfo.discountInfo}
                                        currentPlanId={upgradeInfo.currentPlanId}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </>
            )}

            {/* Add-on Services Tab Content */}
            {activeSubTab === "addons" && (
                <div className="relative">
                    {/* Available Add-on Services */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-heading font-semibold text-lg">Available Add-on Services</h3>
                        </div>

                        {availableAddOnServices.length > 0 ? (
                            <div className="bg-card rounded-xl border overflow-hidden">
                                <div className="divide-y divide-border/50">
                                    {availableAddOnServices.map((service) => {
                                        const inCart = isInCart(service.id);
                                        return (
                                            <div
                                                key={service.id}
                                                className={`group p-5 transition-colors ${inCart ? 'bg-primary/5' : 'hover:bg-accent/30'}`}
                                            >
                                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                                    {/* Service Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                <Package className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                                                    {service.name}
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {service.category}
                                                                    {service.priceLabel && ` • ${service.priceLabel}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Price & Actions */}
                                                    <div className="flex items-center gap-3 w-full lg:w-auto">
                                                        {/* Price */}
                                                        <div className="flex-shrink-0">
                                                            <span className="font-bold text-lg text-foreground">
                                                                ₹{formatPrice(service.price)}
                                                            </span>
                                                        </div>

                                                        {inCart ? (
                                                            /* Already in cart - show update controls */
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1 bg-accent/50 rounded-full px-1.5 py-1.5 border border-border">
                                                                    <button
                                                                        onClick={() => {
                                                                            const cartItem = cartItems.find(i => i.id === service.id);
                                                                            if (cartItem) updateQuantity(service.id, cartItem.quantity - 1);
                                                                        }}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-background transition-all duration-200"
                                                                    >
                                                                        <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    </button>
                                                                    <span className="w-8 text-center font-semibold text-sm text-foreground">
                                                                        {cartItems.find(i => i.id === service.id)?.quantity || 0}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => {
                                                                            const cartItem = cartItems.find(i => i.id === service.id);
                                                                            if (cartItem) updateQuantity(service.id, cartItem.quantity + 1);
                                                                        }}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-background transition-all duration-200"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeFromCart(service.id)}
                                                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                                    title="Remove from cart"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            /* Not in cart - show add controls */
                                                            <>
                                                                {/* Quantity Controls */}
                                                                <div className="flex items-center gap-1 bg-accent/50 rounded-full px-1.5 py-1.5 border border-border">
                                                                    <button
                                                                        onClick={() => handleDecrement(service.id)}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-background transition-all duration-200"
                                                                    >
                                                                        <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    </button>
                                                                    <span className="w-8 text-center font-semibold text-sm text-foreground">
                                                                        {quantities[service.id] || 1}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleIncrement(service.id)}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-background transition-all duration-200"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    </button>
                                                                </div>

                                                                {/* Add to Cart Button */}
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleAddToCart(service)}
                                                                    className="flex items-center gap-2 whitespace-nowrap"
                                                                >
                                                                    <Calculator className="h-4 w-4" />
                                                                    <span className="hidden sm:inline">Add to Cart</span>
                                                                    <span className="sm:hidden">Add</span>
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card rounded-xl border p-8 text-center">
                                <BadgeCheck className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                                <h4 className="font-medium mb-1">All Caught Up!</h4>
                                <p className="text-muted-foreground text-sm">
                                    You've subscribed to all available add-on services.
                                </p>
                            </div>
                        )}
                    </div>



                    {/* Custom Request CTA */}
                    <div className="bg-gradient-primary rounded-xl p-6 text-white text-center mt-6">
                        <h3 className="font-heading font-semibold text-lg mb-2">Need Something Custom?</h3>
                        <p className="text-white/80 text-sm mb-4">
                            Contact your account manager for custom service packages tailored to your needs.
                        </p>
                        <Button
                            variant="secondary"
                            className="bg-white text-primary hover:bg-white/90 flex items-center gap-2 mx-auto"
                            onClick={() => {
                                const message = encodeURIComponent(`Hi ${managerName || 'Manager'}! I'm ${currentUser?.name || 'a client'} and I'm interested in a custom service package for my account.`);
                                window.open(`https://wa.me/${managerPhone}?text=${message}`, '_blank');
                            }}
                            disabled={!managerPhone}
                        >
                            <MessageSquare className="h-4 w-4" />
                            Contact Account Manager
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPlanTab;
