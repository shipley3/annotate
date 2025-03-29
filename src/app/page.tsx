import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="display-4 mb-4">
        Welcome to Frankenstein AI Reading Companion
      </h1>
      <p className="lead mb-4">
        An interactive platform for students to read Mary Shelley's Frankenstein
        with AI-powered literary analysis and discussion.
      </p>
      <div className="d-flex gap-3 justify-content-center">
        <Link
          href="/chapters"
          className="btn btn-primary btn-lg"
        >
          Start Reading
        </Link>
        <Link
          href="/about"
          className="btn btn-secondary btn-lg"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}
