import mongoose from 'mongoose';
import BlogPost from '../models/BlogPost.js';
import Service from '../models/Service.js';
import PricingPlan from '../models/PricingPlan.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';
import TeamMember from '../models/TeamMember.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Milestone from '../models/Milestone.js';
import CatalogService from '../models/CatalogService.js';

import { allBlogPosts } from '../data/allBlogPosts.js';
import { allServices } from '../data/allServices.js';
import { plans, planFeatures } from '../data/pricingPlans.js';
import { allFAQs } from '../data/allFAQs.js';
import { allTestimonials } from '../data/allTestimonials.js';
import { teammembers } from '../data/teammembers.js';
import { companyData } from '../data/company.js';
import { jobPositions } from '../data/jobs.js';
import { companymilestones } from '../data/milestones.js';
import { servicesCatalog } from '../data/servicesCatalog.js';

const MONGODB_URI = "mongodb+srv://fakhripinnacleconsulting_db_user:ZCWFaxd69MRLg50w@cluster0.gs7gptj.mongodb.net/?appName=Cluster0";

async function seedPublicData() {
    try {
        console.log('Connecting to MongoDB via specific URI...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing public data
        await BlogPost.deleteMany({});
        await Service.deleteMany({});
        await PricingPlan.deleteMany({});
        await FAQ.deleteMany({});
        await Testimonial.deleteMany({});
        await TeamMember.deleteMany({});
        await Company.deleteMany({});
        await Job.deleteMany({});
        await Milestone.deleteMany({});
        await CatalogService.deleteMany({});

        console.log('Cleared existing public website data');

        // Seed Company Data
        await Company.create(companyData);
        console.log('Seeded company data');

        // Seed Jobs
        await Job.insertMany(jobPositions.map(j => ({
            ...j,
            id: undefined
        })));
        console.log(`Seeded ${jobPositions.length} job positions`);

        // Seed Milestones
        await Milestone.insertMany(companymilestones.map(m => ({
            ...m,
            id: undefined
        })));
        console.log(`Seeded ${companymilestones.length} milestones`);

        // Seed BlogPosts
        await BlogPost.insertMany(allBlogPosts.map(post => ({
            ...post,
            id: undefined,
            status: 'published'
        })));
        console.log(`Seeded ${allBlogPosts.length} blog posts`);

        // Seed Services
        await Service.insertMany(allServices.map(service => ({
            ...service,
            serviceId: service.id,
            id: undefined
        })));
        console.log(`Seeded ${allServices.length} services`);

        // Seed PricingPlans
        await PricingPlan.insertMany(plans.map(plan => ({
            ...plan,
            planId: plan.id,
            id: undefined,
            features: planFeatures.map(f => ({
                text: f.text,
                value: f.values[plan.id],
                included: f.included.includes(plan.id)
            })),
            order: plans.indexOf(plan)
        })));
        console.log(`Seeded ${plans.length} pricing plans`);

        // Seed FAQs
        await FAQ.insertMany(allFAQs.map(faq => ({
            question: faq.question,
            answer: faq.answer,
            categories: faq.categories,
            order: faq.order || 0
        })));
        console.log(`Seeded ${allFAQs.length} FAQs`);

        // Seed Testimonials
        await Testimonial.insertMany(allTestimonials.map(t => ({
            type: t.type || 'social',
            category: t.category || 'General',
            author: {
                name: t.author.name,
                role: t.author.role,
                company: t.author.company,
                handle: t.author.handle,
                image: t.author.image
            },
            content: t.content,
            quote: t.content,
            rating: t.rating || 5,
            metric: t.metric,
            featured: t.featured || false,
            order: t.order || 0
        })));
        console.log(`Seeded ${allTestimonials.length} testimonials`);

        // Seed TeamMembers
        await TeamMember.insertMany(teammembers.map(tm => ({
            ...tm,
            id: undefined,
            category: tm.category === 'Core Leadership' ? 'Leadership Team' : tm.category
        })));
        console.log(`Seeded ${teammembers.length} team members`);

        // Seed CatalogServices
        await CatalogService.insertMany(servicesCatalog.map(s => ({
            ...s,
            serviceId: s.id,
            id: undefined
        })));
        console.log(`Seeded ${servicesCatalog.length} catalog services`);

        console.log('Public Data Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedPublicData();
