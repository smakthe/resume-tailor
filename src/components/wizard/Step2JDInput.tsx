"use client";

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

  const getJDValidation = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return { isValid: false, message: "" };
    if (trimmed.length < 100)
      return { isValid: false, message: "Too short to be a complete job description." };

    const keywords = [
      "experience", "requirements", "skills", "responsibilities", "role",
      "qualifications", "team", "years", "degree", "bachelor",
      "opportunity", "company", "salary", "bonus", "equity", "benefits",
      "required", "preferred", "looking for", "about us", "description",
      "must have", "nice to have", "what you'll do", "equal opportunity"
    ];

    const lowerText = trimmed.toLowerCase();
    const matchCount = keywords.filter((kw) => lowerText.includes(kw)).length;

    if (matchCount < 3) {
      return {
        isValid: false,
        message: "This does not appear to be a valid job description.",
      };
    }

    return { isValid: true, message: "" };
  };

  const validation = getJDValidation(jobDescription);

  const handleNext = () => {
    if (validation.isValid) {
      setStep(3);
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
            className={`min-h-[250px] resize-y font-serif text-sm leading-relaxed transition-colors focus-visible:ring-primary/40 focus-visible:border-primary/60 ${
              !validation.isValid && jobDescription.trim().length > 0
                ? "border-destructive focus-visible:ring-destructive/40 focus-visible:border-destructive"
                : ""
            }`}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </motion.div>
        {!validation.isValid && validation.message && (
          <Alert variant="destructive" className="mt-4 animate-in fade-in zoom-in duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validation.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button disabled={!validation.isValid} onClick={handleNext}>
          Tailor Resume
        </Button>
      </CardFooter>
    </>
  );
}
