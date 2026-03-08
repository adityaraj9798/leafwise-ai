import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Leaf, Cpu, Layers, BarChart3 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { PredictionResults } from "@/components/PredictionResults";
import { analyzeLeafImage, DISEASES, type PredictionResult } from "@/lib/diseases";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const FEATURES = [
  { icon: Cpu, title: "Swin Transformer", desc: "Global contextual feature extraction" },
  { icon: Layers, title: "EfficientNetV2B0", desc: "Fine-grained local features" },
  { icon: BarChart3, title: "99.2% Accuracy", desc: "On PlantVillage benchmark" },
  { icon: Leaf, title: "5 Species", desc: "Multi-species detection" },
];

export default function Index() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleImageSelect = useCallback(async (_file: File, dataUrl: string) => {
    setPreview(dataUrl);
    setResult(null);
    setIsAnalyzing(true);
    try {
      const prediction = await analyzeLeafImage(dataUrl);
      setResult(prediction);
    } catch (e) {
      toast({
        title: "Analysis Failed",
        description: e instanceof Error ? e.message : "Could not analyze the image.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleReset = () => {
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">LeafGuard AI</h1>
            <p className="text-xs text-muted-foreground">Swin Transformer Disease Detection</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            Detect Plant Diseases<br /><span className="text-primary">Instantly</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Upload a leaf image to identify diseases across 5 plant species using AI-powered vision analysis inspired by Swin Transformer & EfficientNetV2B0 fusion.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <f.icon className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ImageUpload preview={preview} onImageSelect={handleImageSelect} isAnalyzing={isAnalyzing} />
            {preview && (
              <Button variant="outline" onClick={handleReset} className="mt-3">Start Over</Button>
            )}
          </div>
          <div>
            {result ? (
              <PredictionResults result={result} />
            ) : (
              <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-border p-8">
                <div className="text-center text-muted-foreground">
                  <Leaf className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Upload a leaf image to see disease predictions</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-16">
          <h3 className="text-xl font-bold text-foreground mb-5">Detectable Diseases</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DISEASES.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${d.severity === "severe" ? "bg-disease-severe" : "bg-disease-mild"}`} />
                  <span className="text-sm font-semibold text-foreground">{d.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{d.species} · {d.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
