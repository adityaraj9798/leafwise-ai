import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a plant pathology expert AI that mimics a Swin Transformer + EfficientNetV2B0 fusion model for plant leaf disease detection.

Analyze the provided leaf image and classify it into exactly ONE of these 8 categories:
1. Apple - Scab (fungal, olive-green to black lesions)
2. Apple - Black Rot (leaf spots, fruit rot, cankers)
3. Apple - Cedar Rust (bright orange-yellow spots)
4. Tomato - Late Blight (water-soaked lesions, Phytophthora infestans)
5. Tomato - Septoria Leaf Spot (small circular spots with dark borders)
6. Strawberry - Leaf Scorch (irregular dark purple spots with tan centers)
7. Grape - Black Rot (brown circular lesions, mummified fruit)
8. Healthy (no disease detected - specify the plant species if identifiable)

You MUST respond using the "classify_leaf" tool.`;

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

    // Strip data URL prefix if present
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
                text: "Analyze this plant leaf image. Identify the plant species and detect any diseases. Provide your classification with confidence scores.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_leaf",
              description: "Return the disease classification result for a plant leaf image.",
              parameters: {
                type: "object",
                properties: {
                  predicted_class: {
                    type: "string",
                    enum: [
                      "apple_scab",
                      "apple_black_rot",
                      "apple_cedar_rust",
                      "tomato_late_blight",
                      "tomato_septoria",
                      "strawberry_scorch",
                      "grape_black_rot",
                      "healthy",
                    ],
                    description: "The predicted disease class",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score between 0 and 1",
                  },
                  species: {
                    type: "string",
                    description: "Identified plant species",
                  },
                  severity: {
                    type: "string",
                    enum: ["healthy", "mild", "severe"],
                    description: "Disease severity level",
                  },
                  description: {
                    type: "string",
                    description: "Brief description of the diagnosis and visible symptoms",
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
                    description: "Top 3 alternative predictions with confidence scores",
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
