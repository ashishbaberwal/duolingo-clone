const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    let message = "Something went wrong while loading your course.";
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // Keep the learner-friendly fallback when the server response is not JSON.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
