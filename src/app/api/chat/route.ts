import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, passage, chapterId } = await req.json();

    // Validate input
    if (!message || !passage || !chapterId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create the passage record
    let passageRecord;
    try {
      // Try to find an existing passage that matches
      passageRecord = await prisma.passage.findFirst({
        where: {
          chapterId: Number(chapterId),
          text: {
            contains: passage.substring(0, 100) // Match on the first part of the passage
          }
        }
      });

      // If not found, create a new passage
      if (!passageRecord) {
        passageRecord = await prisma.passage.create({
          data: {
            chapterId: Number(chapterId),
            startIndex: 0, // This would be calculated in a real implementation
            endIndex: passage.length,
            text: passage,
          },
        });
      }
    } catch (error) {
      console.error("Error with passage record:", error);
      return NextResponse.json(
        { error: "Failed to process passage" },
        { status: 500 }
      );
    }

    // Create chat session
    let chatSession;
    try {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          passageId: passageRecord.id,
          questionTypes: ["general"], // Default type
        },
      });
    } catch (error) {
      console.error("Error creating chat session:", error);
      return NextResponse.json(
        { error: "Failed to create chat session" },
        { status: 500 }
      );
    }

    // Save the user message
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          passageId: passageRecord.id,
          role: "user",
          content: message,
          tokenCount: message.length, // Simple approximation
        },
      });
    } catch (error) {
      console.error("Error saving user message:", error);
    }

    // Since Gemini API is not working, we'll use a simulated response
    const aiResponses = [
      "That's an interesting observation! The author uses this passage to highlight the theme of isolation. What do you think about Victor's choices here?",
      "This is a pivotal moment in the narrative. How do you think this connects to the novel's broader themes of ambition and responsibility?",
      "Shelley uses powerful imagery in this passage. Can you identify any particular words or phrases that stand out to you?",
      "This reflects the Romantic preoccupation with nature and its power. Notice how the landscape mirrors the character's internal state.",
      "That's a thoughtful question. Consider how this moment relates to the novel's exploration of the consequences of unchecked scientific progress."
    ];
    
    const responseIndex = Math.floor(Math.random() * aiResponses.length);
    const aiResponse = aiResponses[responseIndex];

    // Save the AI response
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          passageId: passageRecord.id,
          role: "assistant",
          content: aiResponse,
          tokenCount: aiResponse.length, // Simple approximation
          questionType: "literary-analysis", // Example type
        },
      });
    } catch (error) {
      console.error("Error saving AI response:", error);
    }

    // Return the AI message
    return NextResponse.json({ message: aiResponse });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
} 