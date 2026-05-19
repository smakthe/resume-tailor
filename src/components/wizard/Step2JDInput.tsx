"use client";

import { useState } from "react";
import { useWizardStore } from "@/store/useWizardStore";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { motion } from "framer-motion";

export function Step2JDInput() {
  const { jobDescription, setJobDescription, setStep } = useWizardStore();
  const [validationError, setValidationError] = useState("");

  const handleNext = () => {
    if (jobDescription.trim().length > 20) {
      setValidationError("");
      setStep(3);
    } else {
      setValidationError(
        "Please paste a comprehensive Job Description (at least a few sentences)."
      );
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">
          Step 2: Paste Job Description
        </CardTitle>
        <CardDescription className="font-serif">
          Paste the raw text of the target Job Description below. The more
          detailed, the better the tailoring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          whileFocus="focus"
          initial="idle"
          variants={{
            idle: { scale: 1 },
            focus: { scale: 1.01 }
          }}
          transition={{ duration: 0.2 }}
        >
          <Textarea
            placeholder="Paste Job Description here…"
            className="min-h-[250px] resize-y font-serif text-sm leading-relaxed transition-colors focus-visible:ring-primary/40 focus-visible:border-primary/60"
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
            if (validationError) setValidationError("");
          }}
        />
        </motion.div>
        {validationError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button onClick={handleNext}>Tailor Resume</Button>
      </CardFooter>
    </>
  );
}
