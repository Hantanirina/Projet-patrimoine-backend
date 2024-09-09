import express from "express";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Chemin du fichier data.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/data.json");

const readData = async () => {
  const data = await fsPromises.readFile(dataPath, "utf-8");
  return JSON.parse(data);
};

const writeData = async (data) => {
  await fsPromises.writeFile(dataPath, JSON.stringify(data, null, 2));
};

// Validation des données de possession
const validatePossession = (possession) => {
  const { libelle, valeur, dateDebut, tauxAmortissement } = possession;
  if (!libelle || typeof libelle !== "string")
    return "Libelle est requis et doit être une chaîne de caractères";
  if (!valeur || isNaN(Number(valeur)))
    return "Valeur est requise et doit être un nombre";
  if (!dateDebut || isNaN(Date.parse(dateDebut)))
    return "DateDebut est requise et doit être une date valide";
  if (tauxAmortissement && isNaN(Number(tauxAmortissement)))
    return "Taux d'amortissement doit être un nombre";
  return null;
};

// Get possession list
router.get("/", async (req, res) => {
  try {
    const data = await readData();
    const possessions = data.find((item) => item.model === "Patrimoine").data
      .possessions;
    res.json({ status: "success", data: possessions });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la lecture des possessions",
      error: error.message,
    });
  }
});

// Create possession
router.post("/", async (req, res) => {
  const { libelle, valeur, dateDebut, taux, dateFin } = req.body;

  // Validation des entrées
  const validationError = validatePossession({
    libelle,
    valeur,
    dateDebut,
    tauxAmortissement: taux,
  });
  if (validationError) {
    return res.status(400).json({ status: "error", message: validationError });
  }

  try {
    const data = await readData();
    const newPossession = {
      id: uuidv4(), // Générer un identifiant unique
      libelle,
      valeur,
      dateDebut,
      tauxAmortissement: taux || 0,
      dateFin: dateFin || null,
    };

    const patrimoine = data.find((item) => item.model === "Patrimoine").data
      .possessions;
    patrimoine.push(newPossession);
    await writeData(data);

    res.status(201).json({
      status: "success",
      message: "Possession créée avec succès",
      data: newPossession,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la création de la possession",
      error: error.message,
    });
  }
});

// Update possession by id
router.put("/:id", async (req, res) => {
  const { libelle, valeur, dateDebut, tauxAmortissement, dateFin } = req.body;

  // Validation des entrées
  const validationError = validatePossession({
    libelle,
    valeur,
    dateDebut,
    tauxAmortissement,
  });
  if (validationError) {
    return res.status(400).json({ status: "error", message: validationError });
  }

  try {
    const data = await readData();
    const patrimoine = data.find((item) => item.model === "Patrimoine").data
      .possessions;
    const possession = patrimoine.find((item) => item.id === req.params.id);

    if (possession) {
      possession.libelle = libelle || possession.libelle;
      possession.valeur = valeur || possession.valeur;
      possession.dateDebut = dateDebut || possession.dateDebut;
      possession.tauxAmortissement =
        tauxAmortissement || possession.tauxAmortissement;
      possession.dateFin = dateFin || possession.dateFin;
      await writeData(data);

      res.json({
        status: "success",
        message: "Possession mise à jour avec succès",
        data: possession,
      });
    } else {
      res
        .status(404)
        .json({ status: "error", message: "Possession non trouvée" });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la mise à jour de la possession",
      error: error.message,
    });
  }
});

// Close possession (set dateFin to current date)
router.put("/:id/close", async (req, res) => {
  try {
    const data = await readData();
    const patrimoine = data.find((item) => item.model === "Patrimoine").data
      .possessions;
    const possession = patrimoine.find((item) => item.id === req.params.id);

    if (possession) {
      possession.dateFin = new Date().toISOString();
      await writeData(data);
      res.json({
        status: "success",
        message: "Possession clôturée avec succès",
        data: possession,
      });
    } else {
      res
        .status(404)
        .json({ status: "error", message: "Possession non trouvée" });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la clôture de la possession",
      error: error.message,
    });
  }
});

// Get total value of possessions at a given date
router.get("/value/:date", async (req, res) => {
  const { date } = req.params;

  try {
    const data = await readData();
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

    res.json({ status: "success", data: { totalValue } });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Erreur lors du calcul de la valeur",
      error: error.message,
    });
  }
});

export default router;
