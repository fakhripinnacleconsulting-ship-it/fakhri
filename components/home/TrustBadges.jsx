'use client';

import { StaggerContainer, StaggerItem } from '@/components/animations/ScrollReveal';
import { Users, Clock, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = [
    <Users key="users" className="w-6 h-6" />,
    <Clock key="clock" className="w-6 h-6" />,
    <Trophy key="trophy" className="w-6 h-6" />,
    <Target key="target" className="w-6 h-6" />
];

export default function TrustBadges({ company }) {
    const badges = company?.badges || [
        { title: "500+", subtitle: "Sellers Trusted" },
        { title: "8+", subtitle: "Years Experience" },
        { title: "25+", subtitle: "Expert Team" },
        { title: "No.1", subtitle: "Amazon Partner" }
    ];

    return (
        <section className="py-16 bg-secondary/20 relative overflow-hidden" aria-label="Key Performance Statistics">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="container-custom relative z-10">
                <StaggerContainer
                    className="grid grid-cols-2 md:grid-cols-4 justify-center gap-6"
                    role="list"
                    aria-label="Trust Badges"
                >
                    {badges.map((badge, index) => (
                        <StaggerItem key={index} role="listitem">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 h-full flex flex-col items-center text-center group shadow-sm hover:shadow-xl"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                    {iconMap[index] || <Trophy className="w-6 h-6" />}
                                </div>
                                <h4 className="text-3xl font-poppins font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
                                    {badge.title}
                                </h4>
                                <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">
                                    {badge.subtitle}
                                </p>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    );
}

