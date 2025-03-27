import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Get GPT response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You're a thoughtful reading companion for Mary Shelley's *Frankenstein*.
The user highlighted this passage:

"""${passage}"""

Engage with the user by asking a reflective question or offering gentle insight.
If they ask a question, answer clearly but keep the conversation open-ended.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const gptResponse = completion.choices[0].message.content;

    // Save GPT response
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: gptResponse || "",
        tokenCount: 0, // TODO: Calculate actual token count
      },
    });

    return NextResponse.json({ message: gptResponse });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 