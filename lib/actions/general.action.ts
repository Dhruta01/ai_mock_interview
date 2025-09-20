// lib/actions/general.action.ts
import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

// Interview type
export type Interview = {
  id: string;
  role: string;
  type: string;
  level: string;
  techstack: string[];
  questions: string[];
  userId: string;
  finalized: boolean;
  coverImage: string;
  createdAt: string;
};

export type SavedMessage = { role: "user" | "system" | "assistant"; content: string };

export type CreateFeedbackParams = {
  interviewId: string;
  userId: string;
  transcript: SavedMessage[];
};

// Get interviews by user
export async function getInterviewsByUserId(userId: string): Promise<Interview[]> {
  const snapshot = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Interview[];
}

// Get latest interviews not belonging to the current user
export async function getLatestInterviews(userId: string, limit = 10): Promise<Interview[]> {
  const snapshot = await db
    .collection("interviews")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .orderBy("userId")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Interview[];
}

// Get interview by ID
export async function getInterviewsById(id: string): Promise<Interview | null> {
  const doc = await db.collection("interviews").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Interview;
}

// Create feedback (server-only)
export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript } = params;

  const formattedTranscript = transcript.map((s) => `-${s.role}: ${s.content}\n`).join("");

  const result = await generateObject({
    model: google("gemini-2.0-flash-001"),
    schema: feedbackSchema,
    prompt: `
You are an AI interviewer analyzing a mock interview. Be detailed and structured.
Transcript:
${formattedTranscript}

Score the candidate 0-100 in these areas:
- Communication Skills
- Technical Knowledge
- Problem-Solving
- Cultural & Role Fit
- Confidence & Clarity
    `,
    system: "You are a professional interviewer analyzing a mock interview.",
  });

  const { object } = result as any;

  const { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment } = object;

  const feedbackRef = await db.collection("feedback").add({
    interviewId,
    userId,
    totalScore,
    categoryScores,
    strengths,
    areasForImprovement,
    finalAssessment,
    createdAt: new Date().toISOString(),
  });

  return { success: true, feedbackId: feedbackRef.id };
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}