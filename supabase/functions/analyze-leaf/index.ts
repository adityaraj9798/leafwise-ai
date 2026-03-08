import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Hugging Face Swin Transformer model for image classification
const HF_MODEL = "microsoft/swin-base-patch4-window7-224";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Map ImageNet labels to our disease classes where possible
const IMAGENET_TO_DISEASE: Record<string, string> = {
  // The Swin model is trained on ImageNet, so we use the raw output
  // and then pass it to the AI for disease-specific mapping
};

const ALL_CLASSES = [
  "apple_scab", "apple_black_rot", "apple_cedar_rust", "apple_powdery_mildew", "apple_fire_blight", "apple_alternaria_leaf_spot",
  "tomato_late_blight", "tomato_early_blight", "tomato_septoria", "tomato_bacterial_spot", "tomato_leaf_mold", "tomato_mosaic_virus",
  "strawberry_scorch", "strawberry_leaf_spot", "strawberry_powdery_mildew", "strawberry_gray_mold", "strawberry_angular_leaf_spot", "strawberry_anthracnose",
  "grape_black_rot", "grape_downy_mildew", "grape_powdery_mildew", "grape_leaf_blight", "grape_esca", "grape_anthracnose",
  "corn_gray_leaf_spot", "corn_common_rust", "corn_northern_leaf_blight", "corn_southern_leaf_blight", "corn_cercospora_leaf_spot", "corn_eyespot",
  "healthy",
];

const CLASSIFICATION_PROMPT = `You are a plant pathology expert. You have two inputs:
1. A leaf image
2. Raw Swin Transformer (microsoft/swin-base-patch4-window7-224) classification output from ImageNet

Using both the visual analysis AND the Swin Transformer features, classify the leaf into one of 31 categories (30 diseases + healthy).

Swin Transformer raw output (top predictions):
{SWIN_OUTPUT}

Use the Swin features as additional context. The model extracts hierarchical multi-scale features via shifted window self-attention. Combine this with your visual analysis to make the final disease classification.

Supported classes: ${ALL_CLASSES.join(", ")}`;

async function callSwinTransformer(imageBase64: string, hfApiKey: string): Promise<string> {
  // Convert base64 to binary for HF API
  const binaryData = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfApiKey}`,
      "Content-Type": "application/octet-stream",
    },
    body: binaryData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Swin Transformer API error:", response.status, text);
    // If model is loading, wait and retry once
    if (response.status === 503) {
      console.log("Model loading, waiting 20s and retrying...");
      await new Promise((r) => setTimeout(r, 20000));
      const retry = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          "Content-Type": "application/octet-stream",
        },
        body: binaryData,
      });
      if (!retry.ok) {
        const retryText = await retry.text();
        throw new Error(`Swin Transformer retry failed: ${retry.status} ${retryText}`);
      }
      const retryData = await retry.json();
      return JSON.stringify(retryData.slice(0, 10), null, 2);
    }
    throw new Error(`Swin Transformer error: ${response.status}`);
  }

  const data = await response.json();
  // Return top 10 predictions from Swin Transformer
  return JSON.stringify(data.slice(0, 10), null, 2);
}

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

    const HF_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!HF_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY is not configured");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/data:(image\/\w+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    // Step 1: Run image through real Swin Transformer on Hugging Face
    let swinOutput = "Swin Transformer unavailable - using visual analysis only";
    try {
      swinOutput = await callSwinTransformer(base64Data, HF_API_KEY);
      console.log("Swin Transformer output:", swinOutput);
    } catch (e) {
      console.error("Swin Transformer call failed, falling back:", e);
    }

    // Step 2: Use AI vision model with Swin features for disease-specific classification
    const prompt = CLASSIFICATION_PROMPT.replace("{SWIN_OUTPUT}", swinOutput);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
              {
                type: "text",
                text: "Classify this leaf image using the Swin Transformer features and your visual analysis. Return the disease classification.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_leaf",
              description: "Return the disease classification result combining Swin Transformer features with visual analysis.",
              parameters: {
                type: "object",
                properties: {
                  predicted_class: {
                    type: "string",
                    enum: ALL_CLASSES,
                    description: "The predicted disease class",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score between 0 and 1",
                  },
                  species: {
                    type: "string",
                    enum: ["Apple", "Tomato", "Strawberry", "Grape", "Corn", "Unknown"],
                    description: "Identified plant species",
                  },
                  severity: {
                    type: "string",
                    enum: ["healthy", "mild", "severe"],
                    description: "Disease severity level",
                  },
                  description: {
                    type: "string",
                    description: "Brief diagnosis describing visible symptoms",
                  },
                  swin_features: {
                    type: "string",
                    description: "Summary of relevant Swin Transformer features that informed the classification",
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
                  "swin_features",
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
