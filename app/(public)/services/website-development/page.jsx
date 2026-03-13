import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Link as LinkIcon, Percent, Database, TrendingUp, XCircle, CheckCircle2, ChevronRight, Phone } from 'lucide-react';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { ContactDialog } from '@/components/dialogs/ContactDialog';

export const metadata = {
    title: "Website Development | Build Your Amazon-Powered Store in 7 Days",
    description: "Launch your independent e-commerce website backed by Amazon infrastructure. Get Amazon trust badge, logistics, and Razorpay at 0.7%. Deploy in just 7 days.",
    keywords: ["e-commerce website development", "Amazon SmartBiz", "Amazon logistics", "Razorpay 0.7%", "online store builder"],
    openGraph: {
        title: "Website Development | Fakhri IT Services",
        description: "Build your Amazon-Powered website in just 7 days.",
        url: 'https://fakhriitservices.com/services/website-development',
        siteName: 'Fakhri IT Services',
        locale: 'en_US',
        type: 'website',
    }
};

export default function WebsiteDevelopmentPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Amazon-Powered Website Development',
        description: 'Building independent e-commerce websites powered by Amazon infrastructure.',
        provider: {
            '@type': 'Organization',
            name: 'Fakhri IT Services',
            url: 'https://fakhriitservices.com'
        },
        offers: {
            '@type': 'Offer',
            price: '0', // Adjust if needed, or omit if price is hidden
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock'
        }
    };

    return (
        <div className="bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* 🟢 SECTION 1: HERO SECTION */}
            <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-orange-50/50 via-white to-orange-50/30 -z-10 dark:from-orange-950/20 dark:via-background dark:to-orange-900/10" />
                <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />

                <div className="container-custom relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <ScrollReveal>
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    Powered by Amazon Infrastructure. Designed by Fakhri Experts.
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
                                    Build Your Own <span className="text-primary italic">Amazon-Powered</span> Website in Just 7 Days
                                </h1>
                                <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance">
                                    Get the Amazon Trust Badge, Amazon Logistics & Razorpay at Only 0.7% — All completely managed by Fakhri Experts.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <ContactDialog
                                        trigger={
                                            <button className="flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group">
                                                <span className="mr-2">🚀</span> Book Free Consultation
                                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        }
                                    />
                                    <a href="tel:+918109653130" className="flex items-center justify-center px-8 py-4 bg-white text-brand-black border border-border font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all dark:bg-card dark:text-foreground dark:hover:bg-accent group">
                                        <Phone className="mr-2 w-5 h-5 text-primary group-hover:animate-pulse" /> Talk to SmartBiz Expert
                                    </a>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Mockup Representation */}
                        <ScrollReveal delay={0.2}>
                            <div className="relative mx-auto w-full max-w-lg aspect-square lg:aspect-auto lg:h-[500px] flex items-center justify-center">
                                {/* Abstract Laptop */}
                                <div className="absolute top-10 left-0 w-full md:w-11/12 h-64 md:h-80 bg-card rounded-t-xl border-x-8 border-t-8 border-gray-800 shadow-2xl overflow-hidden flex flex-col z-10 dark:border-gray-900">
                                    <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 flex items-center px-3 gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="flex-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-background p-4 flex flex-col items-center justify-center">
                                        <div className="w-3/4 h-8 bg-gray-200 dark:bg-gray-800 rounded-md mb-4 animate-pulse"></div>
                                        <div className="w-full h-32 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-4 flex items-center justify-center">
                                            <span className="text-orange-500 font-bold opacity-50">Website Preview</span>
                                        </div>
                                        <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
                                    </div>
                                </div>
                                {/* Keyboard base */}
                                <div className="absolute top-[296px] md:top-[352px] left-[-5%] w-[110%] md:w-[100%] h-4 bg-gray-300 dark:bg-gray-700 rounded-b-xl shadow-xl z-20"></div>

                                {/* Abstract Mobile */}
                                <div className="absolute bottom-0 right-0 w-32 md:w-40 h-64 md:h-72 bg-card rounded-[2rem] border-8 border-gray-800 shadow-2xl overflow-hidden z-30 dark:border-gray-900 flex flex-col">
                                    <div className="w-1/2 h-4 bg-gray-800 absolute top-0 left-1/4 rounded-b-xl z-10 dark:bg-gray-900"></div>
                                    <div className="flex-1 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/40 dark:to-card p-3 pt-6 flex flex-col items-center">
                                        <div className="w-full h-24 bg-primary/20 rounded-lg mb-3"></div>
                                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                                        <div className="w-full h-10 bg-primary text-white rounded-md flex items-center justify-center text-[10px] font-bold">Buy Now</div>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* 🟢 SECTION 2 & 3: Problem vs Solution */}
            <section className="section-padding bg-muted/30">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Problem Section */}
                        <ScrollReveal>
                            <div className="p-8 md:p-10 bg-card rounded-3xl border border-red-100 shadow-sm dark:border-red-900/30 h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-[50px] -z-10 dark:bg-red-900/20" />
                                <h2 className="text-2xl md:text-3xl font-bold mb-8">Why Only Selling on Marketplace is Risky?</h2>
                                <ul className="space-y-5">
                                    {[
                                        "High commission charges eating your margins",
                                        "No customer data access for remarketing",
                                        "Limited brand control and identity",
                                        "Dependency entirely on Amazon algorithm",
                                        "No direct customer relationship"
                                    ].map((point, i) => (
                                        <li key={i} className="flex items-start gap-4 text-lg">
                                            <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </ScrollReveal>

                        {/* Solution Section */}
                        <ScrollReveal delay={0.2}>
                            <div className="p-8 md:p-10 bg-card rounded-3xl border border-primary/20 shadow-xl ring-1 ring-primary/10 h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -z-10" />
                                <div className="mb-8">
                                    <span className="badge-primary mb-3 block w-max">The SmartBiz Solution</span>
                                    <h2 className="text-2xl md:text-3xl font-bold">Launch Your Own Website Backed by Amazon Infrastructure</h2>
                                </div>
                                <ul className="space-y-5">
                                    {[
                                        "Your Own Professional Website (Domain & Brand)",
                                        "Amazon Powered Checkout for High Conversion",
                                        "Amazon Internal Logistics Support",
                                        "Razorpay Only 0.7% Payment Gateway Charges",
                                        "Combine With Your Existing Amazon Seller Account",
                                        "Total Brand Control + Higher Profit Margins"
                                    ].map((point, i) => (
                                        <li key={i} className="flex items-start gap-4 text-lg font-medium">
                                            <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                                            <span className="text-foreground">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* 🟢 SECTION 4: Key Benefits - 6 Icon Grid */}
            <section className="section-padding bg-brand-black text-brand-white">
                <div className="container-custom">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Why SmartBiz Website is a Game Changer for Sellers</h2>
                        <p className="text-xl text-brand-gray">Unlock enterprise-grade infrastructure at a fraction of the cost.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: ShieldCheck, title: "Amazon Trust Badge", desc: "Customers see Amazon-powered checkout — which dramatically increases your conversion rate." },
                            { icon: Truck, title: "Amazon Internal Logistics", desc: "Use the reliable Amazon shipping & fulfillment network to deliver directly to your website customers." },
                            { icon: LinkIcon, title: "Connect with Seller Account", desc: "Sync your products & manage operations smoothly combining your website and marketplace." },
                            { icon: Percent, title: "Razorpay ONLY 0.7%", desc: "Exclusive via Fakhri! Enjoy the lowest payment gateway charges available in the market." },
                            { icon: Database, title: "Direct Customer Data", desc: "Build your own customer database for effective remarketing and brand loyalty loops." },
                            { icon: TrendingUp, title: "Higher Profit Margins", desc: "Sell direct to consumer without the heavy marketplace commission fees cutting into profits." }
                        ].map((benefit, i) => {
                            const Icon = benefit.icon;
                            return (
                                <ScrollReveal key={i} delay={i * 0.1}>
                                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all group h-full hover:bg-white/10">
                                        <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary transition-all">
                                            <Icon className="w-7 h-7 text-primary group-hover:text-brand-black transition-colors" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 text-white">{benefit.title}</h3>
                                        <p className="text-brand-gray leading-relaxed">{benefit.desc}</p>
                                    </div>
                                </ScrollReveal>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* 🟢 SECTION 5: Why Choose Fakhri? */}
            <section className="section-padding bg-background relative overflow-hidden">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 w-full">
                            <ScrollReveal>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">We Don't Just Build Websites —<br /><span className="text-primary">We Build E-Commerce Growth Systems</span></h2>
                                <p className="text-lg text-muted-foreground mb-8">
                                    Partnering with Fakhri IT Services ensures your Amazon SmartBiz website is built for high conversion, search visibility, and operational efficiency from day one.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                    {[
                                        "Professional homepage design",
                                        "Banner & conversion optimized layout",
                                        "Product listing optimization",
                                        "WhatsApp automation setup",
                                        "Basic SEO setup for Google search",
                                        "Lightning-fast 7 days deployment",
                                        "Dedicated support team & manager"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-foreground">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollReveal>
                        </div>
                        <div className="flex-1 w-full flex justify-center lg:justify-end">
                            <ScrollReveal delay={0.2}>
                                <div className="relative p-2 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl border border-primary/20 backdrop-blur-sm">
                                    <div className="bg-card rounded-2xl p-8 shadow-xl max-w-sm w-full relative z-10 text-center">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <span className="text-3xl">🤝</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Ready for Growth?</h3>
                                        <p className="text-muted-foreground mb-6">Let our experts handle the tech so you can focus on building your brand.</p>
                                        <ContactDialog
                                            trigger={
                                                <button className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                                                    Talk to Us Today
                                                </button>
                                            }
                                        />
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🟢 SECTION 6: Packages Section */}
            <section className="section-padding bg-muted/50">
                <div className="container-custom">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your Growth Plan</h2>
                        <p className="text-xl text-muted-foreground">Transparent pricing. No hidden fees. Designed for every stage of your business.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
                        {/* Package 1 */}
                        <ScrollReveal delay={0}>
                            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:border-primary/30 transition-all h-full flex flex-col">
                                <h3 className="text-2xl font-bold mb-2">🥉 Smart Launch</h3>
                                <p className="text-muted-foreground text-sm mb-6">Perfect for starting your direct-to-consumer journey.</p>
                                <div className="h-px w-full bg-border mb-6"></div>
                                <ul className="space-y-4 flex-1 mb-8">
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Website setup</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>20 products upload</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Payment integration</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Shipping integration</span></li>
                                </ul>
                                <ContactDialog trigger={<button className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors">Select Plan</button>} />
                            </div>
                        </ScrollReveal>

                        {/* Package 2 - Highlighted */}
                        <ScrollReveal delay={0.1}>
                            <div className="bg-card p-8 rounded-3xl border-2 border-primary shadow-2xl relative transform md:-translate-y-4 h-[calc(100%+2rem)] flex flex-col">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-sm font-bold px-4 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
                                <h3 className="text-2xl font-bold mb-2">🥈 Growth Package</h3>
                                <p className="text-muted-foreground text-sm mb-6">For aggressive sellers wanting automated scaling.</p>
                                <div className="h-px w-full bg-border mb-6"></div>
                                <ul className="space-y-4 flex-1 mb-8">
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span className="font-semibold">Custom design</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span className="font-semibold">50 products upload</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span className="font-semibold">WhatsApp automation</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span className="font-semibold">SEO setup</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Everything in Smart Launch</span></li>
                                </ul>
                                <ContactDialog trigger={<button className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-lg">Select Growth Plan</button>} />
                            </div>
                        </ScrollReveal>

                        {/* Package 3 */}
                        <ScrollReveal delay={0.2}>
                            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:border-primary/30 transition-all h-full flex flex-col">
                                <h3 className="text-2xl font-bold mb-2">🥇 Premium Brand</h3>
                                <p className="text-muted-foreground text-sm mb-6">Full-scale enterprise solution for established brands.</p>
                                <div className="h-px w-full bg-border mb-6"></div>
                                <ul className="space-y-4 flex-1 mb-8">
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>100+ products upload</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Conversion optimization</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Marketing consultation</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Dedicated account manager</span></li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Everything in Growth</span></li>
                                </ul>
                                <ContactDialog trigger={<button className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors">Select Plan</button>} />
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* 🟢 SECTION 7: How It Works (Process) */}
            <section className="section-padding bg-background">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Go Live in 4 Simple Steps</h2>
                        <p className="text-xl text-muted-foreground">A streamlined process to get your website running fast.</p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-[10%] w-[80%] h-1 bg-muted -translate-y-1/2 z-0" />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            {[
                                { step: "1", title: "Free Consultation", desc: "We understand your brand and product catalog." },
                                { step: "2", title: "Design & Setup", desc: "Our designers craft a professional storefront." },
                                { step: "3", title: "Product Upload", desc: "We integrate your inventory and descriptions." },
                                { step: "4", title: "Go Live in 7 Days", desc: "Start accepting orders with Amazon checkout!" },
                            ].map((item, i) => (
                                <ScrollReveal key={i} delay={i * 0.1}>
                                    <div className="flex flex-col items-center text-center group">
                                        <div className="w-16 h-16 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center text-xl font-bold text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            {item.step}
                                        </div>
                                        <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                                        <p className="text-muted-foreground">{item.desc}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 🟢 SECTION 8: FAQ Section */}
            <section className="section-padding bg-muted/30">
                <div className="container-custom max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: "Is this separate from Amazon marketplace?", a: "Yes. This is your independent branded website. While it uses Amazon's checkout infrastructure for payment trust, the site itself is your own property on your own domain." },
                            { q: "Can I connect my existing Amazon seller account?", a: "Absolutely! We seamlessly integrate your current price calculator data to sync orders, inventory, and logistics directly through SmartBiz." },
                            { q: "How is SmartBiz different from Shopify?", a: "Unlike Shopify which requires separate payment gateways (high fees) and logistics planning, SmartBiz is an all-in-one suite offering native Amazon logistics pricing and an unbeatable 0.7% Razorpay transaction fee." },
                            { q: "What are the total charges?", a: "Apart from our one-time setup package fee, you only pay a minimal 0.7% transaction fee. There are no heavy % commissions like marketplace selling." },
                            { q: "Who will manage logistics?", a: "Amazon's internal logistics network will pick up and deliver your products. It operates automatically just like your regular FBA or Easy Ship marketplace orders." }
                        ].map((faq, i) => (
                            <ScrollReveal key={i} delay={i * 0.1}>
                                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                                    <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                        {faq.q}
                                    </h4>
                                    <p className="text-muted-foreground pl-4">{faq.a}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🟢 SECTION 9: Final CTA */}
            <section className="py-24 bg-brand-black relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-orange-600/20 via-transparent to-transparent opacity-60" />

                <div className="container-custom relative z-10 text-center">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white text-balance">Start Your Own Amazon-Powered Website Today</h2>
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-medium mb-10 backdrop-blur-md">
                            <span className="text-xl">🚀</span> Limited Time Offer – Razorpay at 0.7%
                        </div>
                        <div className="flex justify-center">
                            <ContactDialog
                                trigger={
                                    <button className="px-10 py-5 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(238,114,20,0.5)] transition-all hover:-translate-y-1 transform">
                                        Book Free Demo Now
                                    </button>
                                }
                            />
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}
