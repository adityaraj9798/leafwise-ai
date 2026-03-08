export interface Disease {
  id: string;
  name: string;
  species: string;
  description: string;
  severity: "healthy" | "mild" | "severe";
}

export const DISEASES: Disease[] = [
  // Apple (6)
  { id: "apple_scab", name: "Apple Scab", species: "Apple", description: "Olive-green to black velvety lesions on leaves and fruit, caused by Venturia inaequalis.", severity: "severe" },
  { id: "apple_black_rot", name: "Black Rot", species: "Apple", description: "Leaf spots with concentric rings, fruit rot, and cankers caused by Botryosphaeria obtusa.", severity: "severe" },
  { id: "apple_cedar_rust", name: "Cedar Apple Rust", species: "Apple", description: "Bright orange-yellow spots on upper leaf surface with tube-like structures beneath, caused by Gymnosporangium juniperi-virginianae.", severity: "mild" },
  { id: "apple_powdery_mildew", name: "Powdery Mildew", species: "Apple", description: "White powdery fungal coating on leaves, shoots, and buds, caused by Podosphaera leucotricha.", severity: "mild" },
  { id: "apple_fire_blight", name: "Fire Blight", species: "Apple", description: "Blackened, wilted shoots resembling fire damage with bacterial ooze, caused by Erwinia amylovora.", severity: "severe" },
  { id: "apple_alternaria_leaf_spot", name: "Alternaria Leaf Spot", species: "Apple", description: "Small brown spots with concentric rings and yellow halos, caused by Alternaria mali.", severity: "mild" },

  // Tomato (6)
  { id: "tomato_late_blight", name: "Late Blight", species: "Tomato", description: "Large water-soaked dark lesions with white mold on underside, caused by Phytophthora infestans.", severity: "severe" },
  { id: "tomato_early_blight", name: "Early Blight", species: "Tomato", description: "Dark concentric ring lesions (target spots) on lower leaves, caused by Alternaria solani.", severity: "mild" },
  { id: "tomato_septoria", name: "Septoria Leaf Spot", species: "Tomato", description: "Small circular spots with dark borders and gray centers on lower leaves, caused by Septoria lycopersici.", severity: "mild" },
  { id: "tomato_bacterial_spot", name: "Bacterial Spot", species: "Tomato", description: "Small dark raised spots on leaves and fruit with yellow halos, caused by Xanthomonas vesicatoria.", severity: "mild" },
  { id: "tomato_leaf_mold", name: "Leaf Mold", species: "Tomato", description: "Pale green to yellow spots on upper leaf, olive-green velvety mold beneath, caused by Passalora fulva.", severity: "mild" },
  { id: "tomato_mosaic_virus", name: "Mosaic Virus", species: "Tomato", description: "Mottled light and dark green mosaic pattern with leaf distortion, caused by Tomato Mosaic Virus (ToMV).", severity: "severe" },

  // Strawberry (6)
  { id: "strawberry_scorch", name: "Leaf Scorch", species: "Strawberry", description: "Irregular dark purple spots with tan centers on older leaves, caused by Diplocarpon earlianum.", severity: "mild" },
  { id: "strawberry_leaf_spot", name: "Leaf Spot", species: "Strawberry", description: "Small circular spots with white centers and reddish-purple borders, caused by Mycosphaerella fragariae.", severity: "mild" },
  { id: "strawberry_powdery_mildew", name: "Powdery Mildew", species: "Strawberry", description: "White powdery growth on leaf undersides causing upward curling, caused by Podosphaera aphanis.", severity: "mild" },
  { id: "strawberry_gray_mold", name: "Gray Mold", species: "Strawberry", description: "Fuzzy gray fungal growth on fruit and flowers, caused by Botrytis cinerea.", severity: "severe" },
  { id: "strawberry_angular_leaf_spot", name: "Angular Leaf Spot", species: "Strawberry", description: "Water-soaked angular lesions bounded by leaf veins that become translucent, caused by Xanthomonas fragariae.", severity: "mild" },
  { id: "strawberry_anthracnose", name: "Anthracnose", species: "Strawberry", description: "Sunken dark lesions on fruit and runners with salmon-colored spore masses, caused by Colletotrichum acutatum.", severity: "severe" },

  // Grape (6)
  { id: "grape_black_rot", name: "Black Rot", species: "Grape", description: "Brown circular lesions with dark borders on leaves and shriveled mummified fruit, caused by Guignardia bidwellii.", severity: "severe" },
  { id: "grape_downy_mildew", name: "Downy Mildew", species: "Grape", description: "Yellow oily spots on upper leaf with white cottony growth beneath, caused by Plasmopara viticola.", severity: "severe" },
  { id: "grape_powdery_mildew", name: "Powdery Mildew", species: "Grape", description: "White-gray powdery coating on leaves, shoots, and berries, caused by Erysiphe necator.", severity: "mild" },
  { id: "grape_leaf_blight", name: "Leaf Blight (Isariopsis)", species: "Grape", description: "Dark brown irregular blotches on leaf margins progressing inward, caused by Pseudocercospora vitis.", severity: "mild" },
  { id: "grape_esca", name: "Esca (Black Measles)", species: "Grape", description: "Tiger-stripe pattern of interveinal chlorosis and necrosis on leaves, caused by fungal trunk disease complex.", severity: "severe" },
  { id: "grape_anthracnose", name: "Anthracnose", species: "Grape", description: "Small circular sunken spots with dark margins on leaves and shoots, caused by Elsinoe ampelina.", severity: "mild" },

  // Corn (6)
  { id: "corn_gray_leaf_spot", name: "Gray Leaf Spot", species: "Corn", description: "Rectangular gray to tan lesions bounded by leaf veins, caused by Cercospora zeae-maydis.", severity: "mild" },
  { id: "corn_common_rust", name: "Common Rust", species: "Corn", description: "Small elongated brick-red to brown pustules on both leaf surfaces, caused by Puccinia sorghi.", severity: "mild" },
  { id: "corn_northern_leaf_blight", name: "Northern Leaf Blight", species: "Corn", description: "Long elliptical gray-green to tan cigar-shaped lesions, caused by Exserohilum turcicum.", severity: "severe" },
  { id: "corn_southern_leaf_blight", name: "Southern Leaf Blight", species: "Corn", description: "Small tan rectangular lesions with parallel sides between veins, caused by Bipolaris maydis.", severity: "mild" },
  { id: "corn_cercospora_leaf_spot", name: "Cercospora Leaf Spot", species: "Corn", description: "Rectangular tan lesions similar to gray leaf spot but with more distinct borders, caused by Cercospora zeina.", severity: "mild" },
  { id: "corn_eyespot", name: "Eyespot", species: "Corn", description: "Small circular spots with tan centers and dark brown to purple concentric rings, caused by Aureobasidium zeae.", severity: "mild" },
];

export const SPECIES = ["Apple", "Tomato", "Strawberry", "Grape", "Corn"];

export interface PredictionResult {
  disease: Disease | null;
  confidence: number;
  isHealthy: boolean;
  allPredictions: { label: string; confidence: number }[];
  description: string;
}

const DISEASE_LABELS: Record<string, string> = Object.fromEntries([
  ...DISEASES.map((d) => [d.id, `${d.species} - ${d.name}`]),
  ["healthy", "Healthy"],
]);

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
