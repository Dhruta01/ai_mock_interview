"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { vapi } from "@/lib/vapi.sdk";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  type: "generate" | "interview";
  interviewId?: string;
  questions?: string[];
}

interface VapiMessage {
  type: string;
  transcriptType?: string;
  role: "user" | "system" | "assistant";
  transcript: string;
}

export const Agent = ({
  userName,
  userId,
  type,
  interviewId,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);

  // Listen to VAPI events
  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

    const onMessage = (message: VapiMessage) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage: SavedMessage = {
          role: message.role,
          content: message.transcript,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: Error) => console.error("VAPI error:", error);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  // Generate feedback after call ends
  const handleGenerateFeedback = async (messages: SavedMessage[]) => {
    if (!interviewId || !userId) return;

    const { success, feedbackId } = await createFeedback({
      interviewId,
      userId,
      transcript: messages,
    });

    if (success && feedbackId) {
      router.push(`/root/interview/${interviewId}/feedback`);
    } else {
      console.error("Error saving feedback");
      router.push("/");
    }
  };

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [callStatus]);

  const handleCall = async () => {
    if (callStatus !== CallStatus.INACTIVE && callStatus !== CallStatus.FINISHED)
      return;

    setCallStatus(CallStatus.CONNECTING);

    try {
      if (type === "generate") {
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
          variableValues: {
            username: userName,
            userid: userId,
            role: "interviewer",
            type,
            level: "beginner",
          },
        });
      } else {
        const formattedQuestions = questions
          ?.map((q) => `-${q}`)
          .join("\n");
        await vapi.start("INTERVIEWER", {
          variableValues: { questions: formattedQuestions ?? "" },
        });
      }
    } catch (err) {
      console.error("Call failed:", err);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    if (callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE)
      return;

    try {
      await vapi.stop();
    } catch (err) {
      console.error("Error stopping call", err);
    }
  };

  const latestMessage = messages[messages.length - 1]?.content;
  const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  return (
    <>
      <div className="call-view">
        <div className="card-interview">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="vapi"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interview</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="user avatar"
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript">
          <p
            key={latestMessage}
            className={cn(
              "transition-opacity duration-500 opacity-0",
              "animate-fadeIn opacity-100"
            )}
          >
            {latestMessage}
          </p>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button className="relative btn-call" onClick={handleCall}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span>{isCallInactiveOrFinished ? "Call" : ". . ."}</span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
