import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, passage, chapterId } = await req.json();

    // Create or get passage
    const passageRecord = await prisma.passage.upsert({
      where: {
        chapterId_startIndex_endIndex: {
          chapterId,
          startIndex: 0, // TODO: Calculate actual indices
          endIndex: 0,
        },
      },
      update: {},
      create: {
        chapterId,
        startIndex: 0,
        endIndex: 0,
        text: passage,
      },
    });

    // Create chat session
    const chatSession = await prisma.chatSession.create({
      data: {
        userId: session.user.id,
        passageId: passageRecord.id,
        messages: {
          create: {
            role: "user",
            content: message,
            tokenCount: 0, // TODO: Calculate actual token count
          },
        },
      },
    });

    // Get Gemini response
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `You're a thoughtful reading companion for Mary Shelley's *Frankenstein*.
The user highlighted this passage:

"""${passage}"""

Engage with the user by asking a reflective question or offering gentle insight.
If they ask a question, answer clearly but keep the conversation open-ended.

User: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiResponse = response.text();

    // Save the assistant's response
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: geminiResponse,
        tokenCount: 0, // TODO: Calculate actual token count
      },
    });

    return NextResponse.json({ message: geminiResponse });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
} 