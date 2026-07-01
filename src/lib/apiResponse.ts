export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status })
}

export function err(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): Response {
  return Response.json({ error: { code, message, ...extra } }, { status })
}
