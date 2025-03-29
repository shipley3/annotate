import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import StudentList from "@/components/dashboard/StudentList";
import ChapterAnalytics from "@/components/dashboard/ChapterAnalytics";

async function getDashboardData() {
  const [totalStudents, totalSessions, totalMessages] = await Promise.all([
    prisma.user.count({
      where: { role: "STUDENT" },
    }),
    prisma.chatSession.count(),
    prisma.chatMessage.count(),
  ]);

  const recentSessions = await prisma.chatSession.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      passage: {
        include: {
          chapter: true,
        },
      },
    },
  });

  const questionTypes = await prisma.chatMessage.groupBy({
    by: ["questionType"],
    _count: true,
    where: {
      questionType: { not: null },
    },
  });

  return {
    totalStudents,
    totalSessions,
    totalMessages,
    recentSessions,
    questionTypes,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/");
  }

  const data = await getDashboardData();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Teacher Dashboard
        </h1>

        <DashboardStats
          totalStudents={data.totalStudents}
          totalSessions={data.totalSessions}
          totalMessages={data.totalMessages}
        />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="bg-white shadow rounded-lg p-6">
              <ul className="divide-y divide-gray-200">
                {data.recentSessions.map((session) => (
                  <li key={session.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {session.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Chapter {session.passage.chapter.id}:{" "}
                          {session.passage.chapter.title}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Question Types
            </h2>
            <div className="bg-white shadow rounded-lg p-6">
              <ul className="divide-y divide-gray-200">
                {data.questionTypes.map((type) => (
                  <li key={type.questionType} className="py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {type.questionType}
                      </span>
                      <span className="text-sm text-gray-500">
                        {type._count} questions
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Chapter Analytics
          </h2>
          <ChapterAnalytics />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Student List
          </h2>
          <StudentList />
        </div>
      </div>
    </div>
  );
} 