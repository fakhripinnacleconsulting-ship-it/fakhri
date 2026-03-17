'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import FAQ from '@/models/FAQ';
import TeamMember from '@/models/TeamMember';
import Testimonial from '@/models/Testimonial';
import PricingPlan from '@/models/PricingPlan';
import PricingFeature from '@/models/PricingFeature';
import Company from '@/models/Company';
import Milestone from '@/models/Milestone';
import Job from '@/models/Job';
import CatalogService from '@/models/CatalogService';
import WebPage from '@/models/WebPage';
import HSN from '@/models/HSN';
import { normalizePeriod } from '@/lib/utils';

export async function getServices() {
    try {
        await connectDB();
        let services = await Service.find({}).sort({ order: 1 }).lean();
        
        if (services.length === 0) {
            const initialServices = [
                { name: "Full Account Management", description: "End-to-end management of your Amazon seller central account.", order: 1, category: "management" },
                { name: "PPC Optimization", description: "Strategic advertising to maximize ROI and minimize ACOS.", order: 2, category: "advertising" },
                { name: "Listing Optimization", description: "Keyword-rich titles and descriptions to boost visibility.", order: 3, category: "seo" },
                { name: "A+ Content Design", description: "Enhanced Brand Content that tells your story and converts.", order: 4, category: "creative" }
            ];
            await Service.create(initialServices);
            services = await Service.find({}).sort({ order: 1 }).lean();
            console.log('Services database seeded.');
        }
        
        return JSON.parse(JSON.stringify(services));
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
}

export async function getCatalogServices() {
    try {
        await connectDB();
        let services = await CatalogService.find({}).sort({ serviceId: 1 }).lean();
        
        if (services.length === 0) {
            const initialCatalog = [
                { serviceId: "CAT-001", name: "A+ Content (5 Modules)", price: 499, category: "Creative", description: "Standard A+ content design for one ASIN." },
                { serviceId: "CAT-002", name: "PPC Audit", price: 199, category: "Advertising", description: "Complete audit of your PPC campaigns." }
            ];
            await CatalogService.create(initialCatalog);
            services = await CatalogService.find({}).sort({ serviceId: 1 }).lean();
            console.log('Catalog services seeded.');
        }
        
        return JSON.parse(JSON.stringify(services));
    } catch (error) {
        console.error('Error fetching catalog services:', error);
        return [];
    }
}

export async function getFAQs(category = '') {
    try {
        await connectDB();
        const query = category ? { [`categories.${category}`]: true } : {};
        let faqs = await FAQ.find(query).sort({ order: 1 }).lean();
        
        if (faqs.length === 0 && !category) {
            const initialFAQs = [
                { question: "What is Amazon SPN?", answer: "Amazon Service Provider Network is a group of certified experts.", order: 1, categories: { home: true, pricing: true } },
                { question: "How long does it take to see results?", answer: "Most clients see significant improvements within 4-8 weeks.", order: 2, categories: { home: true } }
            ];
            await FAQ.create(initialFAQs);
            faqs = await FAQ.find(query).sort({ order: 1 }).lean();
            console.log('FAQs database seeded.');
        }
        
        return JSON.parse(JSON.stringify(faqs));
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return [];
    }
}

export async function getTeamMembers() {
    try {
        await connectDB();
        let members = await TeamMember.find({}).sort({ category: 1, order: 1 }).lean();
        
        if (members.length === 0) {
            const initialMembers = [
                { name: "Mustafa Fakhri", role: "CEO & Founder", category: "Leadership Team", order: 1, image: "https://images.unsplash.com/photo-1560250097-0b93528c311a" },
                { name: "Ali Asgar", role: "Operations Head", category: "Leadership Team", order: 2, image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e" }
            ];
            await TeamMember.create(initialMembers);
            members = await TeamMember.find({}).sort({ category: 1, order: 1 }).lean();
            console.log('Team members database seeded.');
        }
        
        return JSON.parse(JSON.stringify(members));
    } catch (error) {
        console.error('Error fetching team members:', error);
        return [];
    }
}

export async function getTestimonials() {
    try {
        await connectDB();
        let testimonials = await Testimonial.find({}).lean();
        
        if (testimonials.length === 0) {
            const initialTestimonials = [
                { 
                    type: 'social',
                    author: { name: "Mustafa Merchant", company: "Amazon Global Seller", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" },
                    content: "Fakhri IT helped me double my sales in just 3 months! Their PPC strategies are game-changing.",
                    rating: 5 
                },
                { 
                    type: 'social',
                    author: { name: "Anjali Sharma", company: "Brand Owner", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330" },
                    content: "The best PPC optimization team I have ever worked with. Highly professional and result-oriented.",
                    rating: 5 
                }
            ];
            await Testimonial.create(initialTestimonials);
            testimonials = await Testimonial.find({}).lean();
            console.log('Testimonials database seeded.');
        }
        
        return JSON.parse(JSON.stringify(testimonials));
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return [];
    }
}

export async function getPricingPlans() {
    try {
        await connectDB();
        const order = ['elite', 'premium', 'platinum'];
        let plans = await PricingPlan.find({}).lean();
        
        if (plans.length === 0) {
            const initialPlans = [
                { planId: "premium", name: "Premium Growth", price: 499, period: "monthly", order: 1, highlights: ["Full Account Management", "PPC Optimization"] },
                { planId: "platinum", name: "Platinum Excellence", price: 999, period: "monthly", order: 2, highlights: ["Dedicated Manager", "Strategic Planning"] }
            ];
            await PricingPlan.create(initialPlans);
            plans = await PricingPlan.find({}).lean();
            console.log('Pricing plans database seeded.');
        }

        // Normalize periods and sort
        const sortedPlans = plans.map(plan => ({
            ...plan,
            period: normalizePeriod(plan.period)
        })).sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
                return a.order - b.order;
            }
            const indexA = order.indexOf(a.planId);
            const indexB = order.indexOf(b.planId);
            return (indexA > -1 ? indexA : 99) - (indexB > -1 ? indexB : 99);
        });

        return JSON.parse(JSON.stringify(sortedPlans));
    } catch (error) {
        console.error('Error fetching pricing plans:', error);
        return [];
    }
}

export async function getCompanyData() {
    try {
        await connectDB();
        let company = await Company.findOne({}).lean();
        
        if (!company) {
            const initialData = {
                name: "Fakhri IT Services",
                logo: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070",
                aboutImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070",
                tagline: "We Are Your Growth Partners in the Amazon Marketplace",
                established: "2016",
                description: "From account credentials to bestseller badges, we handle every aspect of your Amazon journey with precision and passion.",
                mission: "To empower Amazon sellers with expert services that drive sustainable growth.",
                vision: "Building the Future of Amazon Brands",
                badges: [
                    { title: "Amazon SPN Partner", subtitle: "Certified Service Provider" },
                    { title: "Since 2016", subtitle: "8+ Years of Excellence" },
                    { title: "500+", subtitle: "Happy Clients" },
                ],
                stats: [
                    { value: "500+", label: "Sellers Trusted", description: "Trusted by leading brands" },
                    { value: "8+", label: "Years Experience", description: "In Amazon marketplace" },
                    { value: "25+", label: "Expert Team", description: "Amazon trained specialists" },
                    { value: "$50M+", label: "Client Revenue", description: "Generated for our clients" }
                ],
                contact: {
                    phone: { primary: "919584426543", whatsapp: "918982675004" },
                    email: { info: "info@fakhriitservices.com", support: "support@fakhriitservices.com" },
                    address: { full: "123 Business Hub, Indore, MP, India" }
                },
                story: {
                    title: "Our Amazon Journey",
                    content: "Founded in 2016, Fakhri IT Services started with a simple mission: to help sellers navigate the complexities of Amazon.",
                    highlights: [
                        "Specialized Amazon Account Management",
                        "Data-Backed Advertising Strategies",
                        "Creative Design & Brand Storytelling",
                        "Technical SEO & Listing Optimization"
                    ]
                },
                culture: {
                    title: "Our Core Values",
                    values: [
                        { title: "Excellence", description: "We strive for perfection in every listing we optimize and every campaign we manage." },
                        { title: "Integrity", description: "Transparent reporting and honest advice are the foundations of our client relationships." },
                        { title: "Innovation", description: "The Amazon marketplace evolves daily; we stay ahead with cutting-edge strategies." },
                        { title: "Client Growth", description: "Your success is our mission. We grow only when our clients grow." }
                    ]
                },
                whyChooseUs: [
                    { title: "Amazon SPN & Affiliate Partner", description: "Officially recognized by Amazon for our expertise and service quality.", icon: "Shield" },
                    { title: "Dedicated Account Managers", description: "Personalized attention with a single point of contact for your business.", icon: "Users" },
                    { title: "Creative A+ & EBC Experts", description: "Award-winning design team that transforms listings into brand experiences.", icon: "Zap" },
                    { title: "Performance-Driven Ads", description: "ROI-focused PPC campaigns that minimize ACOS and maximize sales.", icon: "Target" },
                    { title: "Transparent Reporting", description: "Clear, actionable insights delivered weekly so you always know your standing.", icon: "BarChart" },
                    { title: "Long-Term Growth Focus", description: "We don't just chase quick wins; we build sustainable brands.", icon: "Trophy" }
                ],
                partners: [
                    { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
                    { name: "Flipkart", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg" },
                    { name: "eBay", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg" },
                    { name: "Shopify", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg" }
                ]
            };
            company = await Company.create(initialData);
            console.log('Company database seeded with initial data.');
        }
        
        return JSON.parse(JSON.stringify(company));
    } catch (error) {
        console.error('Error fetching company data:', error);
        return null;
    }
}

export async function getMilestones() {
    try {
        await connectDB();
        let milestones = await Milestone.find({}).sort({ order: 1 }).lean();
        
        if (milestones.length === 0) {
            const initialMilestones = [
                { year: "2016", title: "The Beginning", description: "Fakhri IT Services was founded with a vision to help Amazon sellers.", order: 1, image: "https://images.unsplash.com/photo-1552664730-d307ca884978" },
                { year: "2018", title: "Amazon SPN Partner", description: "Became an official Amazon Service Provider Network partner.", order: 2, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f" }
            ];
            await Milestone.create(initialMilestones);
            milestones = await Milestone.find({}).sort({ order: 1 }).lean();
            console.log('Milestones database seeded.');
        }
        
        return JSON.parse(JSON.stringify(milestones));
    } catch (error) {
        console.error('Error fetching milestones:', error);
        return [];
    }
}

export async function getJobs() {
    try {
        await connectDB();
        const jobs = await Job.find({ status: 'open' }).sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(jobs));
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
}
export async function updateCompanyData(data) {
    await connectDB();
    try {
        const company = await Company.findOneAndUpdate({}, data, { upsert: true, new: true }).lean();
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(company));
    } catch (error) {
        console.error('Error updating company data:', error);
        return null;
    }
}

export async function upsertTeamMember(member) {
    await connectDB();
    try {
        const id = member._id || member.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await TeamMember.findByIdAndUpdate(id, member, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = member;
            updated = await TeamMember.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting team member:', error);
        return null;
    }
}

export async function deleteTeamMember(id) {
    await connectDB();
    try {
        await TeamMember.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting team member:', error);
        return { success: false };
    }
}

export async function upsertPricingPlan(plan) {
    await connectDB();
    try {
        // Normalize period before saving
        if (plan.period) {
            plan.period = normalizePeriod(plan.period);
        }

        const id = plan._id || plan.id;
        const planId = plan.planId;
        // Strip out internal IDs to avoid Mongoose update issues
        const { _id, id: oldId, ...updateData } = plan;

        let updated;

        // 1. Try to update by ID if it's a valid MongoDB ID
        if (id && id.toString().length >= 24) {
            updated = await PricingPlan.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true }
            ).lean();
        }

        // 2. If no updated yet, try to find and update by business key (planId)
        if (!updated && planId) {
            updated = await PricingPlan.findOneAndUpdate(
                { planId }, 
                updateData, 
                { new: true, upsert: true }
            ).lean();
        }

        // 3. Last resort: create if still nothing (unlikely with upsert above but safe)
        if (!updated) {
            updated = await PricingPlan.create(updateData);
        }

        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting pricing plan:', error);
        // Handle specific duplicate key error if it still slips through
        if (error.code === 11000) {
            console.log('Duplicate planId detected, trying recovery...');
            const planId = plan.planId;
            const { _id, id: oldId, ...updateData } = plan;
            return await PricingPlan.findOneAndUpdate(
                { planId },
                updateData,
                { returnDocument: 'after' }
            ).lean().then(res => JSON.parse(JSON.stringify(res))).catch(() => null);
        }
        return null;
    }
}

export async function deletePricingPlan(id) {
    await connectDB();
    try {
        await PricingPlan.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting pricing plan:', error);
        return { success: false };
    }
}

export async function getPricingFeatures() {
    try {
        await connectDB();
        let features = await PricingFeature.find({}).sort({ order: 1 }).lean();

        if (features.length === 0) {
            const initialFeatures = [
                { text: "Full Account Management", order: 1, description: "End-to-end strategic oversight." },
                { text: "PPC Advertising Control", order: 2, description: "Daily campaign optimization." },
                { text: "FBA Shipment Planning", order: 3, description: "In-bound logistics management." },
                { text: "Monthly Sales Reports", order: 4, description: "Detailed performance analysis." }
            ];
            await PricingFeature.create(initialFeatures);
            features = await PricingFeature.find({}).sort({ order: 1 }).lean();
            console.log('Pricing features database seeded.');
        }

        return JSON.parse(JSON.stringify(features));
    } catch (error) {
        console.error('Error fetching pricing features:', error);
        return [];
    }
}

export async function upsertPricingFeature(feature) {
    await connectDB();
    try {
        const id = feature._id || feature.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await PricingFeature.findByIdAndUpdate(id, feature, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = feature;
            updated = await PricingFeature.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting pricing feature:', error);
        return null;
    }
}

export async function deletePricingFeature(id) {
    await connectDB();
    try {
        await PricingFeature.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting pricing feature:', error);
        return { success: false };
    }
}

export async function upsertService(service) {
    await connectDB();
    try {
        const id = service._id || service.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await Service.findByIdAndUpdate(id, service, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = service;
            updated = await Service.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting service:', error);
        return null;
    }
}

export async function deleteService(id) {
    await connectDB();
    try {
        await Service.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting service:', error);
        return { success: false };
    }
}

export async function upsertTestimonial(testimonial) {
    await connectDB();
    try {
        const id = testimonial._id || testimonial.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await Testimonial.findByIdAndUpdate(id, testimonial, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = testimonial;
            updated = await Testimonial.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting testimonial:', error);
        return null;
    }
}

export async function deleteTestimonial(id) {
    await connectDB();
    try {
        await Testimonial.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        return { success: false };
    }
}

export async function upsertFAQ(faq) {
    await connectDB();
    try {
        const id = faq._id || faq.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await FAQ.findByIdAndUpdate(id, faq, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = faq;
            updated = await FAQ.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting FAQ:', error);
        return null;
    }
}

export async function deleteFAQ(id) {
    await connectDB();
    try {
        await FAQ.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        return { success: false };
    }
}

export async function upsertJob(job) {
    await connectDB();
    try {
        const id = job._id || job.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await Job.findByIdAndUpdate(id, job, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = job;
            updated = await Job.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting job:', error);
        return null;
    }
}

export async function deleteJob(id) {
    await connectDB();
    try {
        await Job.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting job:', error);
        return { success: false };
    }
}

export async function upsertCatalogService(service) {
    await connectDB();
    try {
        const id = service._id || service.id;
        let updated;
        if (id && id.toString().length >= 12) {
            const { _id, id: oldId, ...updateData } = service;
            updated = await CatalogService.findByIdAndUpdate(id, updateData, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = service;
            updated = await CatalogService.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting catalog service:', error);
        return null;
    }
}

export async function deleteCatalogService(id) {
    await connectDB();
    try {
        await CatalogService.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting catalog service:', error);
        return { success: false };
    }
}

export async function getWebPage(slug) {
    try {
        await connectDB();
        const page = await WebPage.findOne({ slug }).lean();
        return page ? JSON.parse(JSON.stringify(page)) : null;
    } catch (error) {
        console.error(`Error fetching web page ${slug}:`, error);
        return null;
    }
}

export async function upsertWebPage(data) {
    await connectDB();
    try {
        const page = await WebPage.findOneAndUpdate(
            { slug: data.slug },
            { ...data, lastUpdated: new Date() },
            { upsert: true, new: true }
        ).lean();
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(page));
    } catch (error) {
        console.error(`Error upserting web page ${data.slug}:`, error);
        return null;
    }
}

export async function upsertMilestone(milestone) {
    await connectDB();
    try {
        const id = milestone._id || milestone.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await Milestone.findByIdAndUpdate(id, milestone, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = milestone;
            updated = await Milestone.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting milestone:', error);
        return null;
    }
}

export async function deleteMilestone(id) {
    await connectDB();
    try {
        await Milestone.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting milestone:', error);
        return { success: false };
    }
}

export async function getHSNs() {
    try {
        let hsnList = await HSN.find({}).sort({ order: 1 }).lean();
        
        if (hsnList.length === 0) {
            const initialHSNs = [
                { serviceName: "Management Consulting", hsnCode: "998311", description: "Strategic management services", order: 1 },
                { serviceName: "Market Research Services", hsnCode: "998351", description: "Amazon market analysis", order: 2 },
                { serviceName: "Advertising Services", hsnCode: "998361", description: "PPC and marketing services", order: 3 },
                { serviceName: "Accounting Services", hsnCode: "998222", description: "Financial reconciliation", order: 4 }
            ];
            await HSN.create(initialHSNs);
            hsnList = await HSN.find({}).sort({ order: 1 }).lean();
            console.log('HSN database seeded.');
        }

        return JSON.parse(JSON.stringify(hsnList));
    } catch (error) {
        console.error('Error fetching HSN codes:', error);
        return [];
    }
}

export async function upsertHSN(hsnData) {
    await connectDB();
    try {
        const id = hsnData._id || hsnData.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await HSN.findByIdAndUpdate(id, hsnData, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = hsnData;
            updated = await HSN.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting HSN:', error);
        return null;
    }
}

export async function deleteHSN(id) {
    await connectDB();
    try {
        await HSN.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting HSN:', error);
        return { success: false };
    }
}

export async function purgePublicCache() {
    try {
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error purging cache:', error);
        return { success: false };
    }
}

