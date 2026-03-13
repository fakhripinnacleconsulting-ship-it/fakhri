'use client';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { PricingCard } from '@/components/ui/PricingCard';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from "framer-motion";
import { ArrowRight, Check, HelpCircle, X } from 'lucide-react';
import FaQ from '../home/FaQ';
import Within2HoursPricingList from '../within-2-hours/Within2HoursPricingList';
import { ContactDialog } from '@/components/dialogs/ContactDialog';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export default function PricingContent({ plans = [], faqs = [], services = [] }) {




    return (
        <>
            {/* Hero Section */}
            <section className="section-padding bg-gradient-to-b from-secondary/50 to-background">
                <div className="container-custom">
                    <ScrollReveal>
                        <div className="text-center max-w-3xl mx-auto">
                            <span className="badge-primary mb-4">Pricing</span>
                            <h1 className="heading-xl mb-6">
                                Transparent <span className="text-primary">Pricing</span> for Every Stage
                            </h1>
                            <p className="body-lg mb-8">
                                Choose the plan that fits your business needs. Scale up as you grow
                                with our flexible pricing options.
                            </p>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="section-padding pt-8">
                <div className="container-custom">
                    {plans.length > 3 ? (
                        <Carousel
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full max-w-7xl mx-auto"
                        >
                            <CarouselContent className="-ml-4">
                                {plans.map((plan, index) => (
                                    <CarouselItem key={plan._id || index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                        <PricingCard
                                            plan={plan}
                                            index={index}
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <div className="hidden md:flex justify-end gap-2 mt-8">
                                <CarouselPrevious className="static translate-y-0" />
                                <CarouselNext className="static translate-y-0" />
                            </div>
                        </Carousel>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {plans.map((plan, index) => (
                                <PricingCard
                                    key={plan._id}
                                    plan={plan}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}

                    {/* Disclaimer */}
                    <ScrollReveal>
                        <div className="mt-12 p-6 bg-secondary/50 rounded-xl max-w-4xl mx-auto">
                            <div className="flex items-start gap-3">
                                <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">
                                    <strong>Important:</strong> Pricing is based on project complexity and scope. Custom quotes available for unique requirements.
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Feature Comparison */}
            {plans.length > 0 && (
                <section id="compare-plans" className="section-padding scroll-mt-20">
                    <div className="container-custom">
                        <ScrollReveal>
                            <div className="text-center mb-12">
                                <h2 className="heading-lg mb-4">Compare Plans</h2>
                                <p className="body-md max-w-2xl mx-auto">
                                    See a detailed breakdown of what's included in each plan
                                </p>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal>
                            <div className="overflow-x-auto pb-4 custom-scrollbar">
                                <table className="w-full min-w-[700px] max-w-6xl mx-auto border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-background/50 sticky top-0 z-10">
                                            <th className="text-left py-6 px-4 font-poppins font-semibold sticky left-0 bg-background/95 backdrop-blur-sm z-20 min-w-[200px] shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Feature</th>
                                            {plans.map((plan) => (
                                                <th
                                                    key={plan._id}
                                                    className={`text-center py-6 px-4 font-poppins font-semibold min-w-[150px] ${plan.highlighted ? 'text-primary bg-primary/5' : ''
                                                        }`}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm uppercase tracking-wider opacity-60 font-bold">{plan.period}</span>
                                                        <span className="text-lg">{plan.name}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from(new Set(
                                            plans.flatMap(plan => plan.features?.map(f => f.text) || [])
                                        )).filter(Boolean).map((featureText, idx) => (
                                            <motion.tr
                                                key={idx}
                                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                viewport={{ once: true }}
                                            >
                                                <td className="py-5 px-4 text-sm font-medium sticky left-0 bg-background/95 backdrop-blur-sm z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                                                    {featureText}
                                                </td>
                                                {plans.map((plan) => {
                                                    const planFeature = plan.features?.find(f => f.text === featureText);
                                                    return (
                                                        <td key={plan._id} className={`text-center py-5 px-4 ${plan.highlighted ? 'bg-primary/5' : ''}`}>
                                                            {planFeature?.included ? (
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-4 ring-primary/5">
                                                                    <Check className="w-5 h-5 text-primary" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
                                                                    <X className="w-4 h-4 text-muted-foreground/30" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>
            )}

            {/* Scenarios Section */}
            <section className="section-padding bg-secondary/30">
                <div className="container-custom">
                    <div className="max-w-6xl mx-auto bg-card rounded-3xl p-8 md:p-12 shadow-lg border border-border">
                        <div className="grid lg:grid-cols-2 gap-12 items-start relative">
                            <div className="order-1 lg:order-2">
                                <ScrollReveal direction="right">
                                    <div className="relative lg:pl-8">
                                        <div style={{ position: "relative", width: "100%", height: "300px" }}>
                                            <Image
                                                src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800"
                                                alt="Service Image"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                </ScrollReveal>
                            </div>

                            <div className="order-2 lg:order-1">
                                <ScrollReveal direction="left">
                                    <div>
                                        <h2 className="heading-lg mb-6">
                                            Need something more specific?
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed mb-8">
                                            We offer specialized services within 2 hours for urgent requirements. From quick listing fixes to PPC troubleshooting, our experts are ready to assist.
                                        </p>
                                        <Link
                                            href="/within-2-hours"
                                            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-poppins font-semibold rounded-lg transition-all duration-300 hover:shadow-lg group"
                                        >
                                            View Quick Services
                                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Service Pricing List */}
            {services.length > 0 && (
                <Within2HoursPricingList
                    services={services}
                    pageInfo={{
                        badge: "A-la-carte",
                        title: "Add-on Services",
                        description: "Enhance your plan with specialized services"
                    }}
                    noticeContent={
                        <>
                            <span className="font-semibold text-primary">💡 Pro Tip:</span> Combine add-on services with your subscription plan for maximum impact and better ROI.
                            <span className="text-foreground ml-1">Custom packages available on request</span>
                        </>
                    }
                />
            )}

            {/* FAQ Section */}
            {faqs.length > 0 && <FaQ data={faqs} />}

            {/* CTA Section */}
            <section className="section-padding">
                <div className="container-custom">
                    <ScrollReveal>
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="heading-lg mb-6">
                                Ready to Get Started?
                            </h2>
                            <p className="body-md mb-8">
                                Contact us for a free consultation and let's discuss which plan
                                works best for your business.
                            </p>
                            <ContactDialog
                                trigger={
                                    <button className="btn-primary" suppressHydrationWarning>
                                        Schedule a Call
                                    </button>
                                }
                            />
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </>
    );
}
