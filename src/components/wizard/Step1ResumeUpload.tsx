"use client";

import { useState, useCallback } from "react";
import { useWizardStore } from "@/store/useWizardStore";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadCloud, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function Step1ResumeUpload() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const { setResumeText, setOriginalPdfBytes, setOriginalFileName, setStep } = useWizardStore();

  const uploadAndParse = async (file: File) => {
    setIsProcessing(true);
    setError("");
    try {
      // Save original PDF bytes and filename for later in-place modification
      const arrayBuffer = await file.arrayBuffer();
      setOriginalPdfBytes(new Uint8Array(arrayBuffer));
      setOriginalFileName(file.name);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      if (!data.text || data.text.trim().length === 0) {
        throw new Error(
          "No text could be extracted from this PDF. Please ensure it contains selectable text (not a scanned image)."
        );
      }

      setResumeText(data.text);
      setStep(2);
    } catch (err) {
      console.error("Error parsing PDF:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not parse PDF. Please try again with a standard text-based PDF."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type === "application/pdf") {
          uploadAndParse(file);
        } else {
          setError("Please upload a valid PDF file.");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndParse(e.target.files[0]);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">Step 1: Upload Your Resume</CardTitle>
        <CardDescription className="font-serif">
          Upload your current resume as a PDF file. We&apos;ll extract the text
          server-side for optimal accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          whileHover={{ scale: isDragActive ? 1 : 1.01 }}
          whileTap={{ scale: 0.99 }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={onDrop}
          className={`
            flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg
            transition-colors duration-300 cursor-pointer
            ${
              isDragActive
                ? "border-primary bg-primary/10 shadow-inner"
                : "border-border/60 hover:border-primary/50 hover:bg-card/50"
            }
          `}
          onClick={() => {
            const fileInput = document.getElementById("pdf-upload") as HTMLInputElement;
            if (fileInput && !isProcessing) fileInput.click();
          }}
        >
          <UploadCloud
            className={`w-14 h-14 mb-5 transition-colors duration-300 ${
              isDragActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="text-sm text-center text-muted-foreground mb-1 font-serif">
            Drag &amp; drop your PDF resume here
          </p>
          <p className="text-xs text-center text-muted-foreground/70 mb-5">
            or click the button below to browse
          </p>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            id="pdf-upload"
            onChange={onFileChange}
            disabled={isProcessing}
          />
          <Button
            variant="secondary"
            className="cursor-pointer pointer-events-none"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Extracting text…
              </span>
            ) : (
              "Browse PDF"
            )}
          </Button>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </>
  );
}
