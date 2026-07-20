import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from 'astro/loaders';

const learn = defineCollection({
    loader: glob({
        pattern: "**/*.(md|mdx)",
        base: "./src/content/learn"
    }),
    schema: z.object({
        title: z.string(),
        path: z.string(),
        description: z.string().optional(),
    }),
});

export const collections = { learn };