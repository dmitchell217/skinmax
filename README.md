# SkinMax

A dermatology-informed skincare routine generator and daily adherence tracker. Generate personalized AM/PM routines in under 30 seconds, track your progress with streaks, and get AI-powered coaching grounded in your routine.

## Project Decisions

### Package Manager
- **Yarn** is used as the package manager (instead of pnpm as originally planned)
- All installation and dependency management commands use `yarn`

### Tech Stack
- **Next.js 16** (App Router) - Note: Architecture doc mentions Next.js 15, but we're using Next.js 16 for latest features
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Vercel** - Hosting platform (KV, Blob Storage, Edge Functions)

### Project Structure
- Uses Next.js App Router (not Pages Router)
- Source files will be organized in `src/` directory per architecture
- Current structure has `app/` at root - will migrate to `src/app/` during setup

## Getting Started

### Prerequisites
- Node.js (see `.nvmrc` for version)
- Yarn package manager

### Installation

```bash
# Install dependencies
yarn install

# Run development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Create a `.env.local` file with:

```
OPENAI_API_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_SITE_URL=
```

See `.env.example` for template.

## Development

### Scripts
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Architecture

See `Architecture.md` for detailed system architecture, data flow, and API contracts.

## Execution Plan

See `execution_plan.md` for the granular, incremental task breakdown following milestones A through O.

## Project Status

🚧 **In Progress** - Currently setting up Milestone A (Repo Scaffold & Configuration)

## License

Private project - All rights reserved
