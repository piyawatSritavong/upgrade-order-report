import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.route.js";
import { categoriesRouter } from "./routes/categories.route.js";
import { ordersRouter } from "./routes/orders.route.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(categoriesRouter);
app.use(ordersRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});