import { db } from "@/firebase/admin";

export async function getInterviewsByUserId(userId?: string): Promise<Interview[] | null> {
  if (!userId) {
    console.warn('getInterviewsByUserId called with undefined userId');
    return []; // skip query if userId undefined
  }

  const snapshot = await db
    .collection('interviews')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

// Get latest interviews NOT belonging to the current user
export async function getLatestInterviews(userId?: string, limit = 10): Promise<Interview[] | null> {
  if (!userId) {
    console.warn('getLatestInterviews called with undefined userId');
    return []; // skip query
  }

  // Firestore requires orderBy('userId') if using '!=' filter
  const snapshot = await db
    .collection('interviews')
    .where('finalized', '==', true)
    .where('userId', '!=', userId)
    .orderBy('userId') // required for '!='
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsById(id: string): Promise<Interview[] | null> {
 const interview = await db
    .collection('interviews')
    .doc(id)
    .get();
 
return interview.data() as Interview | null;

}

