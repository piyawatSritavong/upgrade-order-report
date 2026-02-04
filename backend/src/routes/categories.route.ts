import { Router } from "express";
import { getCategories } from "../services/categories.service.js";

export const categoriesRouter = Router();

categoriesRouter.get("/categories", async (req, res) => {
  try {
    const data = await getCategories();
    res.json(data);
  } catch (e) {
    console.log("Error fetching categories:", e);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});