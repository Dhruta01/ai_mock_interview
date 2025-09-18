import React from 'react'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { dummyInterviews } from '@/constants';
import InterviewCard from "@/components/InterviewCard";
import { getCurrentUser ,getInterviewsByUserId, getLatestInterviews } from '@/lib/actions/auth.action';

const Page = async()=> {
//   const user = await getCurrentUser();
//   const [userInterviews,latestInterviews] = await Promise.all([
//     await getInterviewsByUserId(user?.id!),
//     await getLatestInterviews({userId: user?.id}),
//   ])
const user = await getCurrentUser();

if (!user?.id) {
  // Handle unauthenticated user or loading state
  return <p>Loading user data or please sign in...</p>;
}

const userId = user.id;

const [userInterviews, latestInterviews] = await Promise.all([
  getInterviewsByUserId(userId),
  getLatestInterviews(userId), // now guaranteed to be defined
]);

  
  const hasPastInterviews = userInterviews?.length > 0;
  const hasUpComingInterviews = latestInterviews?.length > 0;
  return (
  <>
  <section className="card-cta">
    <div className="flex flex-col gap-6 max-w-lg">
      <h2>Get Interview-Ready with AI-Powered practice & Feedback</h2>
      <p className="text-lg">
        Practice on real interview question & get instant feedback
      </p>

      <Button asChild className="btn-primary max-sm:w-full">
        <Link href="/root/interview">Start an interview</Link>
      </Button>
    </div>

    <Image src="/robot.png" alt="robo-dude" width={400} height={400} className="max-sm:hidden"/>

  </section>

  <section className="flex flex-col gap-6 mt-8 max-w-6xl mx-auto" >
    <h2>Your Interviews</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {hasPastInterviews ? (
          userInterviews ?.map((interview) =>(
            <InterviewCard {... interview} key={interview.id} />
          ))):(
          <p>You haven&apos;t taken any interview yet</p>
        )
      }
    </div>
  </section>

  <section className="flex flex-col gap-6 mt-8 max-w-6xl mx-auto">
    <h2>Take an interview</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {hasUpComingInterviews ? (
          latestInterviews?.map((interview) =>(
            <InterviewCard {... interview} key={interview.id} />
          ))):(
          <p>There are no new interviews available</p>
        )
      }
      {/*<p>You haven&apos; taken any interviews yet</p>*/}
    </div>
  </section>
  </>
  
  )

    
}
export default Page