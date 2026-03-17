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

const SOURCE_URI = "mongodb://fakhri_db:yZYRUaY1QP2XOovD@ac-fdjdt3f-shard-00-00.60chvjn.mongodb.net:27017,ac-fdjdt3f-shard-00-01.60chvjn.mongodb.net:27017,ac-fdjdt3f-shard-00-02.60chvjn.mongodb.net:27017/?ssl=true&replicaSet=atlas-sv13d6-shard-0&authSource=admin&retryWrites=true&w=majority";
const TARGET_URI = "mongodb+srv://fakhripinnacleconsulting_db_user:ZCWFaxd69MRLg50w@cluster0.gs7gptj.mongodb.net/?appName=Cluster0";

async function migrateData() {
    try {
        console.log('Connecting to Source MongoDB...');
        await mongoose.connect(SOURCE_URI);
        console.log('Connected to Source MongoDB');

        // Fetch data
        const blogPosts = await BlogPost.find({}).lean();
        const services = await Service.find({}).lean();
        const pricingPlans = await PricingPlan.find({}).lean();
        const faqs = await FAQ.find({}).lean();
        const testimonials = await Testimonial.find({}).lean();
        const teamMembers = await TeamMember.find({}).lean();
        const companies = await Company.find({}).lean();
        const jobs = await Job.find({}).lean();
        const milestones = await Milestone.find({}).lean();
        const catalogServices = await CatalogService.find({}).lean();

        console.log(`Fetched data from source...`);
        console.log(`- BlogPosts: ${blogPosts.length}`);
        console.log(`- Services: ${services.length}`);
        console.log(`- PricingPlans: ${pricingPlans.length}`);
        console.log(`- FAQs: ${faqs.length}`);
        console.log(`- Testimonials: ${testimonials.length}`);
        console.log(`- TeamMembers: ${teamMembers.length}`);
        console.log(`- Companies: ${companies.length}`);
        console.log(`- Jobs: ${jobs.length}`);
        console.log(`- Milestones: ${milestones.length}`);
        console.log(`- CatalogServices: ${catalogServices.length}`);

        await mongoose.disconnect();
        console.log('Disconnected from Source MongoDB\n');

        console.log('Connecting to Target MongoDB...');
        await mongoose.connect(TARGET_URI);
        console.log('Connected to Target MongoDB');

        // Clear existing target data
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

        console.log('Cleared existing public website data on Target');

        // Seed data
        if (blogPosts.length) await BlogPost.insertMany(blogPosts);
        if (services.length) await Service.insertMany(services);
        if (pricingPlans.length) await PricingPlan.insertMany(pricingPlans);
        if (faqs.length) await FAQ.insertMany(faqs);
        if (testimonials.length) await Testimonial.insertMany(testimonials);
        if (teamMembers.length) await TeamMember.insertMany(teamMembers);
        if (companies.length) await Company.insertMany(companies);
        if (jobs.length) await Job.insertMany(jobs);
        if (milestones.length) await Milestone.insertMany(milestones);
        if (catalogServices.length) await CatalogService.insertMany(catalogServices);

        console.log('Migration completed successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateData();
