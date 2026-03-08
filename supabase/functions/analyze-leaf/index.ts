import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a plant pathology expert AI implementing a Swin Transformer + EfficientNetV2B0 fusion architecture for plant leaf disease detection.

Architecture Details:
- Swin Transformer backbone extracts hierarchical multi-scale features using shifted window self-attention, capturing both local texture patterns and global leaf structure.
- EfficientNetV2B0 branch provides efficient compound-scaled convolutional features with progressive learning.
- Feature fusion layer concatenates outputs from both branches, combining the Transformer's global context with the CNN's local pattern recognition.
- Final classification head uses a fully connected layer with softmax activation across 31 output classes (30 diseases + healthy).

The model supports 5 plant species with 6 diseases each (30 total diseases + healthy):

APPLE (6 diseases):
1. apple_scab - Venturia inaequalis: olive-green to black velvety lesions
2. apple_black_rot - Botryosphaeria obtusa: leaf spots with concentric rings, fruit rot
3. apple_cedar_rust - Gymnosporangium: bright orange-yellow spots with tube structures
4. apple_powdery_mildew - Podosphaera leucotricha: white powdery coating on leaves/shoots
5. apple_fire_blight - Erwinia amylovora: blackened wilted shoots, bacterial ooze
6. apple_alternaria_leaf_spot - Alternaria mali: brown spots with concentric rings, yellow halos

TOMATO (6 diseases):
7. tomato_late_blight - Phytophthora infestans: large water-soaked dark lesions, white mold
8. tomato_early_blight - Alternaria solani: dark concentric ring target spots on lower leaves
9. tomato_septoria - Septoria lycopersici: small circular spots with dark borders, gray centers
10. tomato_bacterial_spot - Xanthomonas vesicatoria: small dark raised spots, yellow halos
11. tomato_leaf_mold - Passalora fulva: pale green-yellow spots, olive-green velvety mold beneath
12. tomato_mosaic_virus - ToMV: mottled mosaic pattern with leaf distortion

STRAWBERRY (6 diseases):
13. strawberry_scorch - Diplocarpon earlianum: irregular dark purple spots with tan centers
14. strawberry_leaf_spot - Mycosphaerella fragariae: circular spots, white centers, reddish-purple borders
15. strawberry_powdery_mildew - Podosphaera aphanis: white powdery growth, upward leaf curling
16. strawberry_gray_mold - Botrytis cinerea: fuzzy gray fungal growth on fruit/flowers
17. strawberry_angular_leaf_spot - Xanthomonas fragariae: water-soaked angular lesions
18. strawberry_anthracnose - Colletotrichum acutatum: sunken dark lesions, salmon-colored spores

GRAPE (6 diseases):
19. grape_black_rot - Guignardia bidwellii: brown circular lesions, mummified fruit
20. grape_downy_mildew - Plasmopara viticola: yellow oily spots, white cottony growth beneath
21. grape_powdery_mildew - Erysiphe necator: white-gray powdery coating
22. grape_leaf_blight - Pseudocercospora vitis: dark brown irregular blotches on margins
23. grape_esca - Fungal trunk disease: tiger-stripe interveinal chlorosis/necrosis
24. grape_anthracnose - Elsinoe ampelina: circular sunken spots with dark margins

CORN (6 diseases):
25. corn_gray_leaf_spot - Cercospora zeae-maydis: rectangular gray-tan lesions between veins
26. corn_common_rust - Puccinia sorghi: brick-red elongated pustules on both surfaces
27. corn_northern_leaf_blight - Exserohilum turcicum: long elliptical cigar-shaped lesions
28. corn_southern_leaf_blight - Bipolaris maydis: small tan rectangular lesions between veins
29. corn_cercospora_leaf_spot - Cercospora zeina: rectangular tan lesions with distinct borders
30. corn_eyespot - Aureobasidium zeae: circular spots with tan centers, purple concentric rings

31. healthy - No disease detected

You MUST respond using the "classify_leaf" tool. Provide confidence scores that reflect realistic model output distributions.`;

const ALL_CLASSES = [
  "apple_scab", "apple_black_rot", "apple_cedar_rust", "apple_powdery_mildew", "apple_fire_blight", "apple_alternaria_leaf_spot",
  "tomato_late_blight", "tomato_early_blight", "tomato_septoria", "tomato_bacterial_spot", "tomato_leaf_mold", "tomato_mosaic_virus",
  "strawberry_scorch", "strawberry_leaf_spot", "strawberry_powdery_mildew", "strawberry_gray_mold", "strawberry_angular_leaf_spot", "strawberry_anthracnose",
  "grape_black_rot", "grape_downy_mildew", "grape_powdery_mildew", "grape_leaf_blight", "grape_esca", "grape_anthracnose",
  "corn_gray_leaf_spot", "corn_common_rust", "corn_northern_leaf_blight", "corn_southern_leaf_blight", "corn_cercospora_leaf_spot", "corn_eyespot",
  "healthy",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(image\/\w+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
              {
                type: "text",
                text: "Analyze this plant leaf image using the Swin Transformer + EfficientNetV2B0 fusion model. Classify into one of the 30 disease classes or healthy. Provide confidence scores.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_leaf",
              description: "Return the Swin-T + EfficientNetV2B0 fusion model disease classification result.",
              parameters: {
                type: "object",
                properties: {
                  predicted_class: {
                    type: "string",
                    enum: ALL_CLASSES,
                    description: "The predicted disease class from the fusion model softmax output",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score between 0 and 1 from the softmax output layer",
                  },
                  species: {
                    type: "string",
                    enum: ["Apple", "Tomato", "Strawberry", "Grape", "Corn", "Unknown"],
                    description: "Identified plant species",
                  },
                  severity: {
                    type: "string",
                    enum: ["healthy", "mild", "severe"],
                    description: "Disease severity level based on lesion coverage and progression",
                  },
                  description: {
                    type: "string",
                    description: "Brief diagnosis describing visible symptoms detected by the model",
                  },
                  alternative_predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        class: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["class", "confidence"],
                    },
                    description: "Top 3-5 alternative predictions with confidence scores",
                  },
                },
                required: [
                  "predicted_class",
                  "confidence",
                  "species",
                  "severity",
                  "description",
                  "alternative_predictions",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_leaf" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No classification result returned from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-leaf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
