import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Chemin du fichier data.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/data.json");

// Get possession list
router.get("/", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    const possessions = data.find((item) => item.model === "Patrimoine").data
      .possessions;
    res.json(possessions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la lecture des possessions" });
  }
});

// Create possession
router.post("/", (req, res) => {
  const { libelle, valeur, dateDebut, taux, dateFin } = req.body;

  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    const newPossession = {
      libelle,
      valeur,
      dateDebut,
      tauxAmortissement: taux,
      dateFin: dateFin || null,
    };

    const patrimoine = data.find((item) => item.model === "Patrimoine").data
      .possessions;
    patrimoine.push(newPossession);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    res.status(201).json({ message: "Possession created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création de la possession" });
  }
});

// Update possession by libelle
router.put("/:libelle", (req, res) => {
  const { libelle, valeur, dateDebut, taux, dateFin } = req.body;

  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    const patrimoine = data.find((item) => item.model === "Patrimoine").data
      .possessions;
    const possession = patrimoine.find(
      (item) => item.libelle === req.params.libelle
    );

    if (possession) {
      possession.libelle = libelle || possession.libelle;
      possession.valeur = valeur || possession.valeur;
      possession.dateDebut = dateDebut || possession.dateDebut;
      possession.tauxAmortissement = taux || possession.tauxAmortissement;
      possession.dateFin = dateFin || possession.dateFin;
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      res.json({ message: "Possession updated successfully" });
    } else {
      res.status(404).json({ message: "Possession not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de la possession" });
  }
});

// Close possession (set dateFin to current date)
router.put("/:libelle/close", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    const patrimoine = data.find((item) => item.model === "Patrimoine").data
      .possessions;
    const possession = patrimoine.find(
      (item) => item.libelle === req.params.libelle
    );

    if (possession) {
      possession.dateFin = new Date().toISOString();
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      res.json({ message: "Possession closed successfully" });
    } else {
      res.status(404).json({ message: "Possession not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la clôture de la possession" });
  }
});
// pour calculer la valeur totale des possessions à une date donnée
router.get("/value/:date", (req, res) => {
  const { date } = req.params;

  try {
    const data = JSON.parse(fs.readFileSync(dataPath));
    const possessions = data.find((item) => item.model === "Patrimoine").data
      .possessions;

    // Calculer la valeur totale des possessions à la date donnée
    const totalValue = possessions.reduce((acc, possession) => {
      if (
        !possession.dateFin ||
        new Date(possession.dateFin) > new Date(date)
      ) {
        const amortissement = possession.tauxAmortissement
          ? parseFloat(possession.tauxAmortissement)
          : 0;
        const valeurInitiale = parseFloat(possession.valeur);
        const valeurActuelle =
          valeurInitiale *
          Math.pow(
            1 - amortissement / 100,
            (new Date(date) - new Date(possession.dateDebut)) /
              (365 * 24 * 60 * 60 * 1000)
          );
        return acc + valeurActuelle;
      }
      return acc;
    }, 0);

    res.json({ totalValue });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du calcul de la valeur" });
  }
});

export default router;
