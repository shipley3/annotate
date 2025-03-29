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

interface ChapterWithSessions {
  id: number;
  title: string;
  sessions: {
    messages: any[];
    endedAt: Date | null;
    startedAt: Date;
    abandoned: boolean;
  }[];
}

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      include: {
        sessions: {
          include: {
            messages: true,
          },
        },
      },
    }) as ChapterWithSessions[];

    const analytics: ChapterAnalytics[] = chapters.map((chapter) => {
      const totalSessions = chapter.sessions?.length ?? 0;
      const totalMessages = chapter.sessions?.reduce(
        (sum: number, session) => sum + (session.messages?.length ?? 0),
        0
      ) ?? 0;
      const totalDuration = chapter.sessions?.reduce(
        (sum: number, session) => {
          if (!session.endedAt || !session.startedAt) return sum;
          return sum + (session.endedAt.getTime() - session.startedAt.getTime());
        },
        0
      ) ?? 0;
      const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
      const completedSessions = chapter.sessions?.filter(
        (session) => !session.abandoned && session.endedAt !== null
      ).length ?? 0;
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