'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield, Users, Zap, Target, BarChart, Trophy, Check } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animations/ScrollReveal';

const iconMap = {
    Shield,
    Users,
    Zap,
    Target,
    BarChart,
    Trophy
};

const defaultStats = [
    { value: "500+", label: "Sellers Trusted" },
    { value: "8+", label: "Years Experience" },
    { value: "25+", label: "Expert Team" }
];

export default function WhyChooseUs({ company }) {
    const stats = (company?.stats && company.stats.length > 0) ? company.stats : defaultStats;

    const expStat = stats.find(s => s.label?.toLowerCase().includes('experience'))?.value || "8+";
    const teamStat = stats.find(s => s.label?.toLowerCase().includes('team'))?.value || "25+";

    const storyHighlights = company?.story?.highlights || [];
    const whyChooseItems = company?.whyChooseUs || [];

    return (
        <section className="section-padding bg-secondary/30" aria-label="Reasons to choose our services">
            <div className="container-custom">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <ScrollReveal direction="left">
                        <div>
                            <span className="badge-primary mb-4">Why Choose Us</span>
                            <h2 className="heading-lg mb-6">
                                We&apos;re Not Just Service Providers, We&apos;re Your <span className="text-primary">Growth Partners</span>
                            </h2>
                            <p className="body-md mb-8">
                                With over {expStat} of experience and a team of {teamStat} Amazon experts,
                                we understand what it takes to succeed on Amazon. We treat your business
                                as our own and work relentlessly to achieve your goals.
                            </p>

                            <ul className="space-y-4" role="list">
                                {storyHighlights.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3" role="listitem">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                                        </div>
                                        <span className="text-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8">
                                <Link href="/contact" className="btn-primary" aria-label="Get a free consultation">
                                    Get Free Consultation
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="right">
                        <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl group">
                            <Image
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                                alt="Fakhri IT Services Team Collaboration"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
                            <div className="absolute bottom-6 left-6 right-6 text-white bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
                                <p className="font-poppins font-semibold text-lg mb-1">Trusted by {stats[0].value} Sellers</p>
                                <p className="text-white/80 text-sm">Join the network of successful Amazon brands.</p>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Core Reasons Grid */}
                <div className="mt-24 pt-16 border-t border-border/50">
                    <ScrollReveal>
                        <div className="text-center mb-16">
                            <h3 className="heading-md mb-4">Our Core Strengths</h3>
                            <p className="text-muted-foreground">What sets us apart in the Amazon ecosystem</p>
                        </div>
                    </ScrollReveal>

                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {whyChooseItems.slice(0, 6).map((item, index) => {
                            const Icon = iconMap[item.icon] || Shield;
                            return (
                                <StaggerItem key={index}>
                                    <div className="card-premium h-full border border-border hover:border-primary/20 bg-background/50">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h4 className="font-bold text-lg mb-3">{item.title}</h4>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </StaggerItem>
                            );
                        })}
                    </StaggerContainer>
                </div>
            </div>
        </section>
    );
}
