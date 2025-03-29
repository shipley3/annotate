"use client";

import { useState, useEffect } from "react";
import { prisma } from "@/lib/prisma";

interface Student {
  id: string;
  name: string | null;
  email: string;
  sessions: {
    id: string;
    createdAt: Date;
    passage: {
      chapter: {
        id: number;
        title: string;
      };
    };
  }[];
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch("/api/students");
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  if (loading) {
    return <div>Loading students...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {students.map((student) => (
              <li key={student.id} className="py-5">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {student.name || "Anonymous"}
                    </p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {student.sessions.length} sessions
                    </span>
                  </div>
                </div>
                {student.sessions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Recent Activity
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {student.sessions.slice(0, 3).map((session) => (
                        <li key={session.id} className="text-sm text-gray-600">
                          Chapter {session.passage.chapter.id}:{" "}
                          {session.passage.chapter.title} -{" "}
                          {new Date(session.createdAt).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 