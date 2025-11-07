# PostAPI

PostAPI is a simple platform to create endpoints, manage keys, and deploy with zero ops. Build, host, and share APIs in minutes. Collaborate with your team and let developers integrate fast.

## Features

- 🚀 **No servers** - Deploy instantly, scale automatically
- 🔒 **Secure by default** - Per-endpoint keys and rate limits
- 📊 **Observability** - Logs and metrics built-in
- 🎨 **Modern UI** - Beautiful, responsive interface built with Next.js and Tailwind CSS
- 🔐 **Authentication** - Secure user management with Clerk

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: Clerk
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Clerk account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd post-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` (create it if it doesn't exist)
   - Add your Clerk keys from your Clerk dashboard:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
post-api/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── sign-in/           # Authentication pages
│   └── sign-up/
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
└── public/                # Static assets
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add your environment variables
4. Deploy!

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
