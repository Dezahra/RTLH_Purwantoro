import { calculateHousingEligibility } from "../utils/calculator.js";

const rawSamples = [
];

// Enrich with calculator scores
export const initialSurveys = rawSamples.map(item => {
  return {
    ...item,
    skor_total: 0,
    kategori_kelayakan: "",
    kategori_label: "",
    color_badge: "badge-info",
    status_color: "#0284c7",
    rekomendasi_sistem: ""
  };
});
