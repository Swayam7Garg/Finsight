import { getSession, signOut } from "next-auth/react";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const BASE_URL = typeof window === "undefined" ? (process.env.API_URL ?? NEXT_PUBLIC_API_URL) : NEXT_PUBLIC_API_URL;

/**
 * Custom error class for API errors with structured error data.
 */
export class ApiClientError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    code: string = "UNKNOWN_ERROR",
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Get the authorization header using the current session's access token.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  return headers;
}

/**
 * Parse the API response, throwing an ApiClientError on failure.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      signOut({ callbackUrl: "/login" });
    }

    let errorData: {
      error?: { code?: string; message?: string; details?: Record<string, string[]> };
      message?: string;
    } = {};

    try {
      errorData = await response.json();
    } catch {
      // Response body may not be valid JSON
    }

    const message =
      errorData.error?.message ??
      errorData.message ??
      `Request failed with status ${response.status}`;

    throw new ApiClientError(
      message,
      response.status,
      errorData.error?.code ?? "UNKNOWN_ERROR",
      errorData.error?.details
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Type-safe API client with automatic auth token injection.
 */
export const apiClient = {
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      });
    }

    const headers = await getAuthHeaders();
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const headers = await getAuthHeaders();

    // When sending FormData (e.g. file uploads), let the browser set the
    // Content-Type header automatically so the multipart boundary is included.
    if (isFormData) {
      delete headers["Content-Type"];
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    return handleResponse<T>(response);
  },
};
