"use client";

import { useEffect, useState } from "react";
import { useWizardStore } from "@/store/useWizardStore";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ReactDiffViewer from "react-diff-viewer-continued";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Step3Review() {
  const {
    extractedResumeText,
    jobDescription,
    aiSuggestions,
    setAiSuggestions,
    setAcceptedSuggestions,
    setFinalApprovedText,
    setStep,
  } = useWizardStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Local state to track which suggestions are accepted
  const [decisions, setDecisions] = useState<
    Record<number, "accept">
  >({});

  useEffect(() => {
    if (aiSuggestions.length === 0 && !error) {
      fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/suggest-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: extractedResumeText,
          jdText: jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch suggestions");
      }

      setAiSuggestions(data.changes || []);

      // Start with all decisions pending (empty object) so the user must actively accept or reject
      setDecisions({});
    } catch (err) {
      console.error(err);
      setError(
        "An error occurred while generating suggestions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDecision = (idx: number) => {
    setDecisions((prev) => {
      const newDecisions = { ...prev };
      if (newDecisions[idx] === "accept") {
        delete newDecisions[idx]; // Undo selection
      } else {
        newDecisions[idx] = "accept";
      }
      return newDecisions;
    });
  };

  const finalizeAndProceed = () => {
    let finalText = extractedResumeText;
    const accepted: typeof aiSuggestions = [];

    aiSuggestions.forEach((suggestion, idx) => {
      if (decisions[idx] === "accept") {
        accepted.push(suggestion);
        finalText = finalText.replace(suggestion.original, suggestion.suggested);
      }
    });

    setAcceptedSuggestions(accepted);
    setFinalApprovedText(finalText);
    setStep(4);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4" />
          <h3 className="text-xl font-bold">Generating Suggestions…</h3>
          <p className="text-muted-foreground mt-2 text-center font-serif">
            Our AI is mapping your experience to the job description.
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-1/4 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchSuggestions} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">
          Step 3: Review Tailored Changes
        </CardTitle>
        <CardDescription className="font-serif">
          Review the AI suggestions. You can accept or reject individual
          changes.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[75vh] overflow-y-auto">
        <div className="space-y-8">
          <AnimatePresence>
            {aiSuggestions.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`border rounded-lg p-4 transition-colors duration-300 ${
                decisions[idx] === "accept"
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="mb-4">
                <p className="text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                  AI Rationale
                </p>
                <p className="text-sm text-foreground font-serif">
                  {suggestion.reason}
                </p>
              </div>
              {/* Diff Viewer */}
              <div className="border rounded overflow-hidden">
                <ReactDiffViewer
                  oldValue={suggestion.original}
                  newValue={suggestion.suggested}
                  splitView={true}
                  hideLineNumbers={true}
                  styles={{
                    contentText: {
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    },
                  }}
                />
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <Button
                  variant={decisions[idx] === "accept" ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleDecision(idx)}
                >
                  {decisions[idx] === "accept" ? "Reject" : "Accept"}
                </Button>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          {aiSuggestions.length === 0 && !isLoading && !error && (
            <p className="text-center text-muted-foreground font-serif py-8">
              No suggestions found. Your resume might already be perfectly
              tailored!
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button 
          disabled={Object.values(decisions).length === 0} 
          onClick={finalizeAndProceed}
        >
          Finalize and Export
        </Button>
      </CardFooter>
    </>
  );
}
