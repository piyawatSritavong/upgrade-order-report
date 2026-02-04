import { db } from "../../db/index.js";
import { categories, subcategories } from "../../db/schema.js";
import { asc } from "drizzle-orm";

export const fetchCategoriesFromDB = async () => {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.categoryId));

  const subs = await db
    .select()
    .from(subcategories)
    .orderBy(asc(subcategories.subcategoryId));

  const map = new Map<string, { subcategoryId: string; subcategoryName: string }[]>();
  for (const s of subs) {
    const arr = map.get(s.categoryId) ?? [];
    arr.push({
      subcategoryId: s.subcategoryId,
      subcategoryName: s.subcategoryName,
    });
    map.set(s.categoryId, arr);
  };

  return cats.map(c => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    subcategories: map.get(c.categoryId) || [],
  }));
};