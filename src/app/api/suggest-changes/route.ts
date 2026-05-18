const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      resumeText: string;
      jdText: string;
    };
    const { resumeText, jdText } = body;

    if (!resumeText || !jdText) {
      return Response.json(
        { error: "Missing resumeText or jdText" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert resume reviewer and ATS optimization specialist.
I will provide you with a candidate's resume text and a target Job Description.
I need you to suggest specific, line-by-line changes to tailor the resume to the Job Description.

Analyze the documents and output a STRICT JSON array of objects representing the suggested changes.
Each object in the array must have exactly these keys:
- "original": the exact original text snippet from the resume you are targeting.
- "suggested": the improved text you are suggesting.
- "reason": a brief explanation of why this change improves ATS fit or impact.

Resume Text:
${resumeText}

Job Description:
${jdText}

Respond ONLY with the raw JSON array. Do not wrap in markdown \`\`\`json or include any conversational text.`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", response.status, errorData);
      return Response.json(
        {
          error: "AI service returned an error",
          details:
            (errorData as Record<string, Record<string, string>>)?.error
              ?.message || `HTTP ${response.status}`,
        },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const textResponse = data.choices?.[0]?.message?.content || "[]";

    let jsonResponse;
    try {
      const cleanedText = textResponse
        .replace(/^```(json)?\n?/, "")
        .replace(/```\n?$/, "")
        .trim();
      jsonResponse = JSON.parse(cleanedText);
    } catch {
      console.error(
        "Failed to parse JSON from AI response:",
        textResponse
      );
      return Response.json(
        { error: "Invalid format returned by AI" },
        { status: 500 }
      );
    }

    return Response.json({ changes: jsonResponse });
  } catch (error) {
    console.error("Error calling Groq:", error);
    return Response.json(
      {
        error: "Failed to generate suggestions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
