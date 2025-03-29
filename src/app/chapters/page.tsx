import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getChapters() {
  const chapters = await prisma.chapter.findMany({
    orderBy: {
      id: "asc",
    },
  });
  return chapters;
}

export default async function ChaptersPage() {
  const chapters = await getChapters();

  return (
    <div className="container">
      <h1 className="display-4 mb-4">Chapters</h1>
      <div className="row g-4">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="col-12">
            <Link
              href={`/chapters/${chapter.id}`}
              className="card text-decoration-none"
            >
              <div className="card-body">
                <h2 className="card-title h4 mb-3">
                  Chapter {chapter.id}: {chapter.title}
                </h2>
                <p className="card-text text-muted">
                  {chapter.content.substring(0, 200)}...
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 