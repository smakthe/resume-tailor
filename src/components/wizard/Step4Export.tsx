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
  FileCheck,
} from "lucide-react";
import { motion } from "framer-motion";

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
      // Create tailored filename
      let tailoredFileName = "Tailored_Resume.pdf";
      if (originalFileName) {
        const baseName = originalFileName.toLowerCase().endsWith(".pdf")
          ? originalFileName.slice(0, -4)
          : originalFileName;
        tailoredFileName = `${baseName}_tailored.pdf`;
      }

      // Prepare JSON payload
      // Convert Uint8Array to Base64 safely
      const uint8ArrayToBase64 = (bytes: Uint8Array) => {
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      };
      
      const pdfBase64 = uint8ArrayToBase64(originalPdfBytes);

      // 1. Send the file and replacements to our native Vercel Python endpoint
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pdfBase64,
          replacements: acceptedSuggestions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "PDF Generation Engine failed.");
      }

      // 2. Download the returned PDF blob (which preserves layout exactly)
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tailoredFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError(
        err instanceof Error ? err.message : "Failed to format the PDF.",
      );
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
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="bg-primary/10 rounded-full p-6 mb-6 relative"
        >
          <CheckCircle2 className="w-16 h-16 text-primary" />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-2 -right-2"
          >
            <FileCheck className="w-6 h-6 text-primary" />
          </motion.div>
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-2"
        >
          Changes Applied
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground font-serif mb-8 text-center max-w-md"
        >
          We used an advanced backend rendering engine to perfectly locate,
          redact, and replace the text in your original PDF. Your layout,
          design, and style remain exactly as you uploaded them.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={isGenerating}
            className="gap-2 px-8 transition-transform hover:scale-105 active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rendering Document…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Tailored PDF
              </>
            )}
          </Button>
        </motion.div>

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
