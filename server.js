import express from "express";
import bodyParser from "body-parser";
import cors from "cors"; // Ajoutez cette ligne
import possessionRoutes from "./routes/possession.js";
import patrimoineRoutes from "./routes/patrimoine.js";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/possession", possessionRoutes);
app.use("/patrimoine", patrimoineRoutes);

// Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
