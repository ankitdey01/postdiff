import {
  apiHeaders,
  capabilitiesResponse,
  healthResponse,
  jsonError,
  productResponse,
  readOnlyMethodError,
} from "../../../lib/api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function getPath(context: RouteContext): Promise<string> {
  const { path } = await context.params;
  return path.join("/");
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  switch (await getPath(context)) {
    case "health":
      return healthResponse();
    case "product":
      return productResponse();
    case "capabilities":
      return capabilitiesResponse();
    default:
      return jsonError(
        404,
        "NOT_FOUND",
        "The requested Postdiff API endpoint does not exist.",
        "Read /openapi.json for the available endpoints and their schemas.",
      );
  }
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
