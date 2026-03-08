export interface Disease {
  id: string;
  name: string;
  species: string;
  description: string;
  severity: "healthy" | "mild" | "severe";
}

export const DISEASES: Disease[] = [
  { id: "apple_scab", name: "Apple Scab", species: "Apple", description: "Fungal disease causing olive-green to black lesions on leaves and fruit.", severity: "severe" },
  { id: "apple_black_rot", name: "Black Rot", species: "Apple", description: "Causes leaf spots, fruit rot, and cankers on branches.", severity: "severe" },
  { id: "apple_cedar_rust", name: "Cedar Rust", species: "Apple", description: "Bright orange-yellow spots on leaves caused by Gymnosporangium fungi.", severity: "mild" },
  { id: "tomato_late_blight", name: "Late Blight", species: "Tomato", description: "Water-soaked lesions that rapidly expand, caused by Phytophthora infestans.", severity: "severe" },
  { id: "tomato_septoria", name: "Septoria Leaf Spot", species: "Tomato", description: "Small circular spots with dark borders and gray centers on lower leaves.", severity: "mild" },
  { id: "strawberry_scorch", name: "Leaf Scorch", species: "Strawberry", description: "Irregular dark purple spots that develop tan centers on older leaves.", severity: "mild" },
  { id: "grape_black_rot", name: "Black Rot", species: "Grape", description: "Brown circular lesions on leaves, shriveled mummified fruit.", severity: "severe" },
];

export const SPECIES = ["Apple", "Tomato", "Strawberry", "Grape", "Healthy"];

export interface PredictionResult {
  disease: Disease | null;
  confidence: number;
  isHealthy: boolean;
  allPredictions: { label: string; confidence: number }[];
}

export function simulatePrediction(): PredictionResult {
  const isHealthy = Math.random() > 0.7;
  
  if (isHealthy) {
    const species = SPECIES[Math.floor(Math.random() * (SPECIES.length - 1))];
    return {
      disease: null,
      confidence: 0.92 + Math.random() * 0.07,
      isHealthy: true,
      allPredictions: [
        { label: `${species} - Healthy`, confidence: 0.92 + Math.random() * 0.07 },
        ...DISEASES.slice(0, 3).map(d => ({ label: `${d.species} - ${d.name}`, confidence: Math.random() * 0.05 })),
      ],
    };
  }

  const disease = DISEASES[Math.floor(Math.random() * DISEASES.length)];
  const conf = 0.85 + Math.random() * 0.14;
  return {
    disease,
    confidence: conf,
    isHealthy: false,
    allPredictions: [
      { label: `${disease.species} - ${disease.name}`, confidence: conf },
      ...DISEASES.filter(d => d.id !== disease.id).slice(0, 3).map(d => ({
        label: `${d.species} - ${d.name}`,
        confidence: Math.random() * (1 - conf),
      })),
    ],
  };
}
