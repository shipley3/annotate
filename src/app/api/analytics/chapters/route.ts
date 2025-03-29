import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ChapterAnalytics {
  chapterId: number;
  title: string;
  totalSessions: number;
  totalMessages: number;
  averageSessionDuration: number;
  completionRate: number;
}

interface ChatMessage {
  id: number;
  role: string;
  content: string;
  tokenCount: number;
  questionType: string | null;
}

interface ChatSession {
  id: number;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface Passage {
  id: number;
  chatSessions: ChatSession[];
}

interface Chapter {
  id: number;
  title: string;
  passages: Passage[];
}

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      include: {
        passages: {
          include: {
            chatSessions: {
              include: {
                messages: true,
              },
            },
          },
        },
      },
    }) as Chapter[];

    const analytics = chapters.map((chapter) => {
      // Get all sessions from all passages in this chapter
      const allSessions = chapter.passages.flatMap((passage: Passage) => passage.chatSessions);
      const totalSessions = allSessions.length;
      
      // Calculate total messages across all sessions
      const totalMessages = allSessions.reduce(
        (sum: number, session: ChatSession) => sum + (session.messages?.length ?? 0),
        0
      );
      
      // Calculate total duration across all sessions
      const totalDuration = allSessions.reduce(
        (sum: number, session: ChatSession) => {
          return sum + (session.updatedAt.getTime() - session.createdAt.getTime());
        },
        0
      );
      
      const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
      const completedSessions = allSessions.filter(
        (session: ChatSession) => session.messages.length > 0
      ).length;
      const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

      return {
        chapterId: chapter.id,
        title: chapter.title,
        totalSessions,
        totalMessages,
        averageSessionDuration,
        completionRate,
      };
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching chapter analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter analytics" },
      { status: 500 }
    );
  }
} 