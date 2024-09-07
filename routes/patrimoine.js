import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Chemin du fichier data.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/data.json");

// Helper function to calculate patrimoine value
function calculateValeur(patrimoine, date) {
  let valeurTotale = 0;
  patrimoine.forEach((possession) => {
    if (!possession.dateFin || new Date(possession.dateFin) > new Date(date)) {
      valeurTotale += possession.valeur;
    }
  });
  return valeurTotale;
}

// Get Valeur Patrimoine by date
router.get("/:date", (req, res) => {
  const date = req.params.date;

  // Validation de la date
  if (isNaN(new Date(date).getTime())) {
    return res.status(400).json({ error: "Date invalide" });
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    const patrimoine =
      data.find((item) => item.model === "Patrimoine")?.data?.possessions || [];

    if (!patrimoine.length) {
      return res
        .status(404)
        .json({ error: "Aucune donnée de patrimoine trouvée" });
    }

    const valeur = calculateValeur(patrimoine, date);
    res.json({ date, valeur });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

// Get Valeur Patrimoine for a range
router.post("/range", (req, res) => {
  const { dateDebut, dateFin, type } = req.body;

  // Validation des dates
  if (
    isNaN(new Date(dateDebut).getTime()) ||
    isNaN(new Date(dateFin).getTime())
  ) {
    return res.status(400).json({ error: "Dates invalides" });
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    const patrimoine =
      data.find((item) => item.model === "Patrimoine")?.data?.possessions || [];

    if (!patrimoine.length) {
      return res
        .status(404)
        .json({ error: "Aucune donnée de patrimoine trouvée" });
    }

    let valeurTotale = 0;
    patrimoine.forEach((possession) => {
      if (
        (!possession.dateFin ||
          new Date(possession.dateFin) > new Date(dateDebut)) &&
        new Date(possession.dateDebut) < new Date(dateFin)
      ) {
        valeurTotale += possession.valeur;
      }
    });

    res.json({ dateDebut, dateFin, type, valeurTotale });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la lecture des données" });
  }
});

export default router;
