import type { ApiResponse } from "@shared/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error("Network error: unable to reach the server. Make sure the backend is running (npm start).");
  }

  const text = await res.text();
  if (!text) {
    throw new Error(`Server returned empty response (HTTP ${res.status}). Is the backend running?`);
  }

  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(`Server returned non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  if (!json.success) {
    throw new Error(json.error || "Request failed");
  }
  return json.data as T;
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
  }
  const query = qs.toString();
  const url = query ? `${path}?${query}` : path;
  return request<T>(url);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
