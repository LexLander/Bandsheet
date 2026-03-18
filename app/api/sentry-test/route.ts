export async function GET() {
  // Intentional error for Sentry integration testing.
  throw new Error('test')
}

export async function POST() {
  // Intentional error for Sentry integration testing.
  throw new Error('test')
}

export async function GET() {
  throw new Error("Sentry test from route.ts");
}
