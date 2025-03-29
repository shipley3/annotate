"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link href="/" className="navbar-brand">
          Frankenstein AI
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link href="/chapters" className="nav-link">
                Chapters
              </Link>
            </li>
            {session?.user?.role === "TEACHER" && (
              <li className="nav-item">
                <Link href="/dashboard" className="nav-link">
                  Teacher Dashboard
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center">
            {session?.user ? (
              <>
                <span className="me-3">
                  {session.user.name} ({session.user.role})
                </span>
                <button
                  onClick={() => signOut()}
                  className="btn btn-danger"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="btn btn-primary"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 