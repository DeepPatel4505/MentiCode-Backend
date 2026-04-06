import slugify from "slugify";
import { prisma } from "../config/prisma.js";

export const generateSlug = (title) =>
  slugify(title, { lower: true, strict: true, trim: true });

// Appends a numeric suffix until the slug is unique in the given model
export const uniqueSlug = async (model, title, excludeId = null) => {
  const base = generateSlug(title);
  let slug = base;
  let counter = 1;

  while (true) {
    const where = { slug };
    if (excludeId) where.id = { not: excludeId };

    const existing = await prisma[model].findFirst({ where });
    if (!existing) return slug;

    slug = `${base}-${counter}`;
    counter++;
  }
};
