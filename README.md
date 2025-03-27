# Frankenstein AI Reading Companion

An interactive platform for students to read Mary Shelley's Frankenstein with AI-powered literary analysis and discussion.

## Features

- Full-screen reader with margin-based chat UI
- Text highlighting and selection for triggering GPT conversations
- Persistent chat sessions for later review
- Teacher analytics dashboard
- Chapter navigation and user authentication

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- NextAuth.js
- OpenAI GPT-4

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your database URL, OpenAI API key, and OAuth credentials

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/             # Utility functions and shared code
├── prisma/          # Database schema and migrations
└── types/           # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
