import { prisma } from "@/lib/prisma";
import Reader from "@/components/Reader";
import { notFound } from "next/navigation";

async function getChapter(id: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: parseInt(id) },
  });

  if (!chapter) {
    notFound();
  }

  return chapter;
}

export default async function ChapterPage({
  params,
}: {
  params: { id: string };
}) {
  const chapter = await getChapter(params.id);

  return (
    <div className="h-100">
      <div className="mb-4">
        <h1 className="display-4">
          Chapter {chapter.id}: {chapter.title}
        </h1>
      </div>
      <Reader chapterId={chapter.id} content={chapter.content} />
    </div>
  );
} 