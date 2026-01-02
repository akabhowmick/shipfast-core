import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    throw new Error("This is a test server-side error from ShipFast Core!");
  } catch (error) {
    Sentry.captureException(error);
    return new Response(
      JSON.stringify({
        error: "Server error triggered and captured by Sentry",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
