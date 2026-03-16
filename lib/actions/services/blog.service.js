'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import BlogPost from '@/models/BlogPost';

export async function getBlogPosts({ page = 1, limit = 10, search = '', category = '' } = {}) {
    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { excerpt: { $regex: search, $options: 'i' } }
        ];
    }

    if (category) {
        query.category = category;
    }

    try {
        await connectDB();
        let posts = await BlogPost.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        let total = await BlogPost.countDocuments(query);

        if (total === 0 && !search && !category) {
            const initialPost = {
                title: "Welcome to Fakhri IT Growth Blog",
                slug: "welcome-to-fakhri-it",
                content: "<p>We are excited to share our insights on the Amazon marketplace with you.</p>",
                excerpt: "An introduction to our new blog platform.",
                category: "Company News",
                author: "Mustafa Fakhri",
                tags: ["Amazon", "Growth", "Welcome"],
                thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
                status: "published"
            };
            await BlogPost.create(initialPost);
            posts = await BlogPost.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
            total = await BlogPost.countDocuments(query);
            console.log('Blog database seeded.');
        }

        return {
            posts: JSON.parse(JSON.stringify(posts)),
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return { posts: [], total: 0, pages: 0, currentPage: page, error: 'Failed to fetch posts' };
    }
}

export async function getBlogPostBySlug(slug) {
    try {
        await connectDB();
        const post = await BlogPost.findOne({ slug }).lean();
        return post ? JSON.parse(JSON.stringify(post)) : null;
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return null;
    }
}

export async function getBlogCategories() {
    try {
        await connectDB();
        const categories = await BlogPost.distinct('category');
        return categories.filter(Boolean);
    } catch (error) {
        console.error('Error fetching blog categories:', error);
        return [];
    }
}

export async function upsertBlogPost(post) {
    await connectDB();
    try {
        console.log(`Upserting blog post: ${post.title}, content length: ${post.content?.length || 0}`);
        const id = post._id || post.id;
        let updated;
        if (id && id.toString().length >= 12) {
            updated = await BlogPost.findByIdAndUpdate(id, post, { new: true, upsert: true }).lean();
        } else {
            const { _id, id: oldId, ...rest } = post;
            updated = await BlogPost.create(rest);
        }
        revalidatePath('/', 'layout');
        return JSON.parse(JSON.stringify(updated));
    } catch (error) {
        console.error('Error upserting blog post:', error);
        return null;
    }
}

export async function deleteBlogPost(id) {
    await connectDB();
    try {
        await BlogPost.findByIdAndDelete(id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error deleting blog post:', error);
        return { success: false };
    }
}
