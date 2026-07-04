const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  return handle<T>(res);
}

export async function apiPost<TBody, TRes>(
  path: string,
  body: TBody,
  token?: string,
): Promise<TRes> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle<TRes>(res);
}

export async function apiPatch<TBody, TRes>(
  path: string,
  body: TBody,
  token?: string,
): Promise<TRes> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle<TRes>(res);
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok && res.status !== 204) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, detail);
  }
}

/** GET a file blob (CSV export). */
export async function apiDownload(path: string, token?: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.blob();
}

/** Multipart upload (e.g. product images). Do NOT set Content-Type — the
 * browser adds the multipart boundary automatically. */
export async function apiUpload<TRes>(
  path: string,
  formData: FormData,
  token?: string,
): Promise<TRes> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  return handle<TRes>(res);
}
