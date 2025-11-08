import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4 py-16">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center text-center">
        {/* Hero Section */}
        <div className="mb-12 space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl md:text-7xl">
            Your derm-informed routine
            <br />
            <span className="text-zinc-600">in 60 seconds</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-zinc-600 sm:text-2xl">
            No fluff. Ingredients that work for your skin and budget.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mb-16 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            Start 60-sec quiz
          </Link>
          <Link
            href="/glow"
            className="inline-flex items-center justify-center rounded-full border-2 border-zinc-900 px-8 py-4 text-lg font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            Glow Score
          </Link>
          <Link
            href="/looks"
            className="inline-flex items-center justify-center rounded-full border-2 border-zinc-900 px-8 py-4 text-lg font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            Looks Playground
          </Link>
        </div>

        {/* Features */}
        <div className="grid w-full max-w-4xl gap-8 sm:grid-cols-3 mb-12">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-zinc-900">30s</div>
            <p className="text-sm text-zinc-600">
              Time to routine
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-zinc-900">AM/PM</div>
            <p className="text-sm text-zinc-600">
              Personalized steps
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-zinc-900">AI</div>
            <p className="text-sm text-zinc-600">
              Grounded coaching
            </p>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2 mb-16">
          <Link
            href="/glow"
            className="group rounded-lg border-2 border-zinc-200 bg-white p-6 hover:border-zinc-900 transition-colors"
          >
            <div className="mb-2 text-xl font-semibold text-zinc-900 group-hover:text-zinc-700">
              Glow Score
            </div>
            <p className="text-sm text-zinc-600">
              Get a personalized skin analysis and tonight's plan based on your selfie
            </p>
          </Link>
          <Link
            href="/looks"
            className="group rounded-lg border-2 border-zinc-200 bg-white p-6 hover:border-zinc-900 transition-colors"
          >
            <div className="mb-2 text-xl font-semibold text-zinc-900 group-hover:text-zinc-700">
              Looks Playground
            </div>
            <p className="text-sm text-zinc-600">
              Discover personalized style recommendations based on your face shape
            </p>
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="mt-16 max-w-2xl text-sm text-zinc-500">
          <p>
            Educational only, not medical advice. For persistent or severe issues, see a board-certified dermatologist.
          </p>
        </div>
      </main>
    </div>
  );
}
