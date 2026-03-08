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
- Final classification head uses a fully connected layer with softmax activation across 7 output classes (6 diseases + healthy).

Analyze the provided leaf image and classify it into exactly ONE of these 7 categories:
1. Apple - Scab (Venturia inaequalis: olive-green to black velvety lesions on leaves)
2. Tomato - Late Blight (Phytophthora infestans: water-soaked dark lesions, white mold on underside)
3. Strawberry - Leaf Scorch (Diplocarpon earlianum: irregular dark purple spots with tan centers)
4. Grape - Black Rot (Guignardia bidwellii: brown circular lesions, mummified fruit)
5. Corn - Gray Leaf Spot (Cercospora zeae-maydis: rectangular gray-tan lesions bounded by veins)
6. Corn - Common Rust (Puccinia sorghi: brick-red elongated pustules on both leaf surfaces)
7. Healthy (no disease detected - specify plant species if identifiable)

You MUST respond using the "classify_leaf" tool. Provide confidence scores that reflect realistic model output distributions.`;

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
                text: "Analyze this plant leaf image using the Swin Transformer + EfficientNetV2B0 fusion model. Identify the plant species and detect any diseases from the 6 supported disease classes. Provide classification with confidence scores reflecting the dual-branch architecture output.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_leaf",
              description: "Return the Swin-T + EfficientNetV2B0 fusion model disease classification result for a plant leaf image.",
              parameters: {
                type: "object",
                properties: {
                  predicted_class: {
                    type: "string",
                    enum: [
                      "apple_scab",
                      "tomato_late_blight",
                      "strawberry_scorch",
                      "grape_black_rot",
                      "corn_gray_leaf_spot",
                      "corn_common_rust",
                      "healthy",
                    ],
                    description: "The predicted disease class from the fusion model",
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
                    description: "Top alternative predictions with confidence scores from the softmax layer",
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
