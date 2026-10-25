import { apiHeaders, productResponse, readOnlyMethodError } from "../../lib/api";

export function GET(): Response {
  return productResponse();
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: apiHeaders() });
}

export function POST(): Response {
  return readOnlyMethodError();
}

export const PUT = readOnlyMethodError;
export const PATCH = readOnlyMethodError;
export const DELETE = readOnlyMethodError;
