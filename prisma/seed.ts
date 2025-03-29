import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  // First, clear existing chapters
  await prisma.chapter.deleteMany();

  // Read the Frankenstein text file
  const text = fs.readFileSync(
    path.join(process.cwd(), "data/frankenstein.txt"),
    "utf-8"
  );

  // Split into chapters (looking for "Chapter" followed by a number)
  const chapters = text.split(/(?=Chapter [0-9]+)/);

  // Create chapters in the database
  for (const chapter of chapters) {
    if (!chapter.trim()) continue;

    const titleMatch = chapter.match(/Chapter [0-9]+/);
    if (!titleMatch) continue;

    const title = titleMatch[0].trim();
    const content = chapter.replace(/Chapter [0-9]+/, "").trim();

    if (content) {
      await prisma.chapter.create({
        data: {
          title,
          content,
        },
      });
      console.log(`Created chapter: ${title}`);
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 