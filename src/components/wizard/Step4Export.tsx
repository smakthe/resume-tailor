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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  RotateCcw,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { applyTextReplacementsToPdf } from "@/lib/pdf-modify";

export function Step4Export() {
  const { acceptedSuggestions, originalFileName, originalPdfBytes, reset } =
    useWizardStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    if (!originalPdfBytes) {
      setError("Original PDF data is missing. Please restart the process.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Create the tailored filename
      let tailoredFileName = "Tailored_Resume.pdf";
      if (originalFileName) {
        const baseName = originalFileName.toLowerCase().endsWith(".pdf")
          ? originalFileName.slice(0, -4)
          : originalFileName;
        tailoredFileName = `${baseName}_tailored.pdf`;
      }

      if (acceptedSuggestions.length === 0) {
        // No changes accepted — just download the original
        downloadBlob(originalPdfBytes, tailoredFileName);
        return;
      }

      const modifiedPdfBytes = await applyTextReplacementsToPdf(
        originalPdfBytes,
        acceptedSuggestions
      );

      downloadBlob(modifiedPdfBytes, tailoredFileName);
    } catch (err) {
      console.error("Error modifying PDF:", err);
      setError(
        "Failed to modify the PDF. Downloading the original instead — you can apply the changes manually."
      );
      // Fallback: download original
      if (originalPdfBytes) {
        downloadBlob(originalPdfBytes, "Original_Resume.pdf");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">
          Step 4: Your Tailored Resume is Ready!
        </CardTitle>
        <CardDescription className="font-serif">
          Download your ATS-optimized resume with all accepted changes applied
          directly to your original PDF — preserving your layout and design.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <div className="bg-primary/10 rounded-full p-6 mb-6">
          <CheckCircle2 className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Changes Applied</h3>
        <p className="text-muted-foreground font-serif mb-8 text-center max-w-md">
          Your resume has been tailored with the accepted suggestions. The
          original layout, fonts, and styling are fully preserved.
        </p>

        <Button
          size="lg"
          onClick={handleDownload}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Tailored Resume
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-6 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="ghost" onClick={reset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Tailor Another Resume
        </Button>
      </CardFooter>
    </>
  );
}

function downloadBlob(data: Uint8Array | ArrayBuffer, filename: string) {
  // Create a clean ArrayBuffer copy to satisfy strict BlobPart typing
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const cleanBuffer = new ArrayBuffer(bytes.length);
  new Uint8Array(cleanBuffer).set(bytes);
  const blob = new Blob([cleanBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
