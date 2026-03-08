import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Leaf } from "lucide-react";
import type { PredictionResult } from "@/lib/diseases";

interface PredictionResultsProps {
  result: PredictionResult;
}

export function PredictionResults({ result }: PredictionResultsProps) {
  const severityConfig = result.isHealthy
    ? { icon: CheckCircle, label: "Healthy", color: "text-disease-healthy", bg: "bg-disease-healthy/10" }
    : result.disease?.severity === "severe"
    ? { icon: XCircle, label: "Severe", color: "text-disease-severe", bg: "bg-disease-severe/10" }
    : { icon: AlertTriangle, label: "Mild", color: "text-disease-mild", bg: "bg-disease-mild/10" };

  const Icon = severityConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Main result */}
      <div className={`rounded-2xl p-6 ${severityConfig.bg} border border-border`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${severityConfig.bg}`}>
            <Icon className={`w-6 h-6 ${severityConfig.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                {result.isHealthy ? "Healthy Leaf" : result.disease?.name}
              </h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityConfig.bg} ${severityConfig.color}`}>
                {severityConfig.label}
              </span>
            </div>
            {!result.isHealthy && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Leaf className="w-3.5 h-3.5" />
                {result.disease?.species}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">{result.description}</p>
          </div>
        </div>
      </div>

      {/* Confidence bars */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Classification Confidence</h4>
        {result.allPredictions
          .sort((a, b) => b.confidence - a.confidence)
          .map((pred, i) => (
            <motion.div
              key={pred.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{pred.label}</span>
                <span className="text-muted-foreground">{(pred.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pred.confidence * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`}
                />
              </div>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
}
