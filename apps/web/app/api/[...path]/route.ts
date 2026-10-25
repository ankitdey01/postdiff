import { jsonError, readOnlyMethodError } from "../../lib/api";

export function GET(): Response {
  return jsonError(
    404,
    "NOT_FOUND",
    "The requested Postdiff API endpoint does not exist.",
    "Use /api/v1 or read /openapi.json for the supported public API surface.",
  );
}

export function POST(): Response {
  return readOnlyMethodError();
}

export const PUT = readOnlyMethodError;
export const PATCH = readOnlyMethodError;
export const DELETE = readOnlyMethodError;
