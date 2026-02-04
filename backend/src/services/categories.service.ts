import { fetchCategoriesFromDB } from "../repository/categories.repository.js";

export const getCategories = async () => {
  const categories = await fetchCategoriesFromDB();
  return categories;
}