import { extractText, getDocumentProxy } from "unpdf";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text, totalPages } = await extractText(pdf, {
      mergePages: true,
    });

    return Response.json({
      text: text,
      pageCount: totalPages,
    });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return Response.json(
      {
        error: "Failed to parse PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
