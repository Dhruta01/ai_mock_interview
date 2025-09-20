import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body: {
    type: string;
    role: string;
    level: string;
    techstack: string;
    amount: number;
    userid: string;
  } = await request.json();

  const { type, role, level, techstack, amount, userid } = body;

  try {
    // Call Vapi workflow instead of generateText
    const workflowRes = await fetch("https://api.vapi.ai/workflow/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 42e14c60-e31e-412a-9f4c-e062ac46a564"
      },
      body: JSON.stringify({
        workflowId: "c886524d-61ee-4d80-ba54-faad3bed6189",
        inputs: { type, role, level, techstack, amount, userid }
      })
    });

    const workflowData = await workflowRes.json();

    // Assume workflow returns questions as an array: workflowData.result.questions
    const questionsArray: string[] = workflowData.result?.questions || [];

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(","),
      questions: questionsArray,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return NextResponse.json({ success: true, questions: questionsArray }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
