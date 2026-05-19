import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const replacementsStr = formData.get("replacements");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }
    
    if (!replacementsStr || typeof replacementsStr !== "string") {
      return NextResponse.json({ error: "No replacements provided" }, { status: 400 });
    }

    const replacements = JSON.parse(replacementsStr);

    // Create temporary files
    const tmpDir = os.tmpdir();
    const uniqueId = Math.random().toString(36).substring(7);
    const inputPath = path.join(tmpDir, `input_${uniqueId}.pdf`);
    const outputPath = path.join(tmpDir, `output_${uniqueId}.pdf`);
    const jsonPath = path.join(tmpDir, `replacements_${uniqueId}.json`);

    // Write input files
    const buffer = await file.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(buffer));
    await fs.writeFile(jsonPath, JSON.stringify(replacements));

    // Execute Python script
    const scriptPath = path.join(process.cwd(), "scripts", "pdf_editor.py");
    
    try {
      await execFileAsync("python3", [scriptPath, inputPath, outputPath, jsonPath]);
    } catch (execError: any) {
      console.error("Python execution failed:", execError.stderr || execError.message);
      
      // Clean up inputs on failure
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(jsonPath).catch(() => {});
      
      return NextResponse.json(
        { error: "PDF generation engine failed", details: execError.stderr }, 
        { status: 500 }
      );
    }

    // Read the modified PDF
    const modifiedBytes = await fs.readFile(outputPath);

    // Clean up temporary files
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
    await fs.unlink(jsonPath).catch(() => {});

    // Return the PDF
    return new NextResponse(modifiedBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Tailored_Resume.pdf"`,
      },
    });

  } catch (error) {
    console.error("Error exporting PDF:", error);
    return NextResponse.json(
      { error: "Failed to export PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
