import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.passage.deleteMany();
    await prisma.chapter.deleteMany();
    
    // Read the Frankenstein text file
    console.log("Reading Frankenstein text...");
    const text = fs.readFileSync(
      path.join(process.cwd(), "data/frankenstein.txt"),
      "utf-8"
    );

    // Clean up the text and remove table of contents
    const cleanText = text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
      .trim();

    // Find the start of the actual content (after table of contents)
    const contentStart = cleanText.indexOf("Letter 1\n\n_To Mrs. Saville, England._");
    if (contentStart === -1) {
      throw new Error("Could not find start of content");
    }

    const mainContent = cleanText.slice(contentStart);

    // Extract the chapters using a more robust approach
    console.log("Extracting chapters...");
    
    // Split text into sections based on chapter markers
    const sections = mainContent.split(/(?=Letter \d+|Chapter \d+)/);

    // Process each section
    for (const section of sections) {
      const letterMatch = section.match(/^Letter (\d+)/);
      const chapterMatch = section.match(/^Chapter (\d+)/);

      if (letterMatch) {
        const letterNum = parseInt(letterMatch[1]);
        const content = section.replace(/Letter \d+/, "").trim();
        const title = `Letter ${letterNum}`;

        console.log(`Creating letter ${letterNum}...`);
        await prisma.chapter.create({
          data: {
            id: -letterNum,
            title,
            content,
          },
        });
      } else if (chapterMatch) {
        const chapterNum = parseInt(chapterMatch[1]);
        const content = section.replace(/Chapter \d+/, "").trim();
        const title = `Chapter ${chapterNum}`;

        console.log(`Creating chapter ${chapterNum}...`);
        await prisma.chapter.create({
          data: {
            id: chapterNum,
            title,
            content,
          },
        });
      }
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 