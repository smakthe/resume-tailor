"use client";

import { useWizardStore } from "@/store/useWizardStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Step1ResumeUpload } from "./Step1ResumeUpload";
import { Step2JDInput } from "./Step2JDInput";
import { Step3Review } from "./Step3Review";
import { Step4Export } from "./Step4Export";
import { FileUp, FileText, ScanSearch, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { label: "Upload", icon: FileUp },
  { label: "Job Description", icon: FileText },
  { label: "Review", icon: ScanSearch },
  { label: "Export", icon: Download },
];

export function WizardContainer() {
  const currentStep = useWizardStore((state) => state.currentStep);
  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-b from-background to-card relative overflow-hidden">
      {/* Decorative vintage noise overlay via global css continues to apply */}
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl mb-10 flex flex-col items-center justify-center text-center relative z-10"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground font-serif drop-shadow-sm">
          AI-Powered Resume Tailor
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl font-serif italic">
          Format your resume cleanly to pass ATS scanning based on the exact
          Job Description.
        </p>
      </motion.div>

      {/* Step Indicator */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-4xl mb-8 relative z-10"
      >
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            const Icon = step.icon;

            return (
              <div
                key={stepNum}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground scale-110 shadow-md"
                        : isCompleted
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-card text-muted-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className={`text-xs transition-all duration-300 ${
                    isCompleted ? "bg-primary/10 text-primary border-primary/30" : ""
                  }`}
                >
                  {step.label}
                </Badge>
              </div>
            );
          })}
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </motion.div>

      {/* Wizard Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-4xl relative z-10"
      >
        <Card className="w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-border/60 min-h-[500px] overflow-hidden backdrop-blur-sm bg-card/95">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              {currentStep === 1 && <Step1ResumeUpload />}
              {currentStep === 2 && <Step2JDInput />}
              {currentStep === 3 && <Step3Review />}
              {currentStep === 4 && <Step4Export />}
            </motion.div>
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-10 text-muted-foreground text-sm flex items-center gap-2 font-serif italic relative z-10"
      >
        Powered by{" "}
        <span className="font-semibold not-italic text-primary">
          Llama 3.3 via Groq
        </span>
      </motion.p>
    </div>
  );
}
