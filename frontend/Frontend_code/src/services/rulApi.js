import { RUL_HISTORY, PRODUCTS, delay } from "./mockData";

// TODO(backend): replace with POST /rul/predict (upload sensor CSV) and
// GET /rul/history/:engineId. The prediction result shape (rul, urgency,
// interpretation) is what the RUL model + business rules must return.
export const rulApi = {
  async predict(engineId) {
    await delay(900);
    const history = RUL_HISTORY[engineId] || [];
    const latest = history[history.length - 1] || { rul: 55 };
    const urgency = latest.rul <= 20 ? "HIGH" : latest.rul <= 50 ? "MEDIUM" : "LOW";
    return {
      engineId,
      predictedRul: latest.rul,
      urgency,
      interpretation:
        urgency === "HIGH"
          ? "Plan replacement soon"
          : urgency === "MEDIUM"
          ? "Monitor closely over the next cycles"
          : "No action needed at this time",
    };
  },

  async getHistory(engineId) {
    await delay();
    return RUL_HISTORY[engineId] || [];
  },

  async getRecommendations(engineId) {
    await delay();
    // Ranking placeholder: compatibility + availability + price + delivery + rating.
    // Real ranking logic belongs on the backend; the FE only renders it.
    const ranked = [...PRODUCTS]
      .filter((p) => p.compatibility.includes("CFM56-7B"))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return {
      basedOn: { engineId, engineModel: "CFM56-7B", predictedRul: 18 },
      top: ranked[0],
      alternatives: ranked.slice(1, 3),
    };
  },
};
