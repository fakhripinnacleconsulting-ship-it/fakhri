'use server';

import * as service from './services/blog.service';

export const getBlogPosts = service.getBlogPosts;
export const getBlogPostBySlug = service.getBlogPostBySlug;
export const getBlogCategories = service.getBlogCategories;
export const upsertBlogPost = service.upsertBlogPost;
export const deleteBlogPost = service.deleteBlogPost;
