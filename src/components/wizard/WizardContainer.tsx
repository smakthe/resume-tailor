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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-4xl mb-10 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">
          AI-Powered Resume Tailor
        </h1>
        <p className="text-muted-foreground text-base md:text-lg font-serif max-w-2xl">
          Format your resume cleanly to pass ATS scanning based on the exact
          Job Description.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="w-full max-w-4xl mb-8">
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
      </div>

      {/* Wizard Card */}
      <Card className="w-full max-w-4xl shadow-lg border border-border/80 min-h-[500px] animate-fade-slide-in">
        <div key={currentStep} className="animate-fade-slide-in">
          {currentStep === 1 && <Step1ResumeUpload />}
          {currentStep === 2 && <Step2JDInput />}
          {currentStep === 3 && <Step3Review />}
          {currentStep === 4 && <Step4Export />}
        </div>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-muted-foreground text-sm flex items-center gap-2 font-serif italic">
        Powered by{" "}
        <span className="font-semibold not-italic text-primary">
          Llama 3.3 via Groq
        </span>
      </p>
    </div>
  );
}
