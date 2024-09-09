import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import possessionRoutes from "./routes/possession.js";
import patrimoineRoutes from "./routes/patrimoine.js";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/possession", possessionRoutes);
app.use("/patrimoine", patrimoineRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "./data/data.json");

const readData = async () => {
  const data = await fsPromises.readFile(dataPath, "utf-8");
  return JSON.parse(data);
};

const writeData = async (data) => {
  await fsPromises.writeFile(dataPath, JSON.stringify(data, null, 2));
};

const addMissingIds = async (possessions) => {
  let updated = false;
  possessions.forEach((possession) => {
    if (!possession.id || possession.id === "") {
      possession.id = uuidv4();
      updated = true;
    }
  });
  return updated;
};

// Appel de la fonction pour ajouter les ids manquants lors du démarrage du serveur
const initializeData = async () => {
  try {
    const data = await readData();
    const patrimoine = data.find((item) => item.model === "Patrimoine").data
      .possessions;

    const updated = await addMissingIds(patrimoine);
    if (updated) {
      await writeData(data);
      console.log("Les ids manquants ont été ajoutés aux possessions");
    } else {
      console.log("Aucun id manquant à ajouter");
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation des données:",
      error.message
    );
  }
};

initializeData();

// Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
