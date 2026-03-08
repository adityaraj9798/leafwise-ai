export interface Disease {
  id: string;
  name: string;
  species: string;
  description: string;
  severity: "healthy" | "mild" | "severe";
}

export const DISEASES: Disease[] = [
  { id: "apple_scab", name: "Apple Scab", species: "Apple", description: "Fungal disease causing olive-green to black lesions on leaves and fruit, caused by Venturia inaequalis.", severity: "severe" },
  { id: "tomato_late_blight", name: "Late Blight", species: "Tomato", description: "Water-soaked lesions that rapidly expand, caused by Phytophthora infestans.", severity: "severe" },
  { id: "strawberry_scorch", name: "Leaf Scorch", species: "Strawberry", description: "Irregular dark purple spots that develop tan centers on older leaves, caused by Diplocarpon earlianum.", severity: "mild" },
  { id: "grape_black_rot", name: "Black Rot", species: "Grape", description: "Brown circular lesions on leaves and shriveled mummified fruit, caused by Guignardia bidwellii.", severity: "severe" },
  { id: "corn_gray_leaf_spot", name: "Gray Leaf Spot", species: "Corn", description: "Rectangular gray to tan lesions bounded by leaf veins, caused by Cercospora zeae-maydis.", severity: "mild" },
  { id: "corn_common_rust", name: "Common Rust", species: "Corn", description: "Small, elongated, brick-red to brown pustules on both leaf surfaces, caused by Puccinia sorghi.", severity: "mild" },
];

export const SPECIES = ["Apple", "Tomato", "Strawberry", "Grape", "Corn"];

export interface PredictionResult {
  disease: Disease | null;
  confidence: number;
  isHealthy: boolean;
  allPredictions: { label: string; confidence: number }[];
  description: string;
}

const DISEASE_LABELS: Record<string, string> = {
  apple_scab: "Apple - Scab",
  tomato_late_blight: "Tomato - Late Blight",
  strawberry_scorch: "Strawberry - Leaf Scorch",
  grape_black_rot: "Grape - Black Rot",
  corn_gray_leaf_spot: "Corn - Gray Leaf Spot",
  corn_common_rust: "Corn - Common Rust",
  healthy: "Healthy",
};

export async function analyzeLeafImage(imageDataUrl: string): Promise<PredictionResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-leaf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Analysis failed (${response.status})`);
  }

  const data = await response.json();

  const isHealthy = data.predicted_class === "healthy";
  const disease = isHealthy ? null : DISEASES.find((d) => d.id === data.predicted_class) || null;

  const allPredictions = [
    { label: DISEASE_LABELS[data.predicted_class] || data.predicted_class, confidence: data.confidence },
    ...(data.alternative_predictions || []).map((p: { class: string; confidence: number }) => ({
      label: DISEASE_LABELS[p.class] || p.class,
      confidence: p.confidence,
    })),
  ];

  return {
    disease,
    confidence: data.confidence,
    isHealthy,
    allPredictions,
    description: data.description,
  };
}
