export const API_VERSION = "1.0.0";

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED";

export function apiHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers({
    "Cache-Control": "public, max-age=60, s-maxage=300",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extra,
  });

  return headers;
}

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  hint: string,
): Response {
  return Response.json(
    {
      error: {
        code,
        message,
        hint,
      },
    },
    { status, headers: apiHeaders({ "Cache-Control": "no-store" }) },
  );
}

export function readOnlyMethodError(): Response {
  return jsonError(
    405,
    "METHOD_NOT_ALLOWED",
    "The Postdiff public API is read-only.",
    "Use GET for the documented product and capability endpoints in /openapi.json.",
  );
}

export function productResponse(): Response {
  return Response.json(
    {
      name: "Postdiff",
      description:
        "A local-first CLI that turns meaningful git commits into reviewable posts in the developer's voice.",
      productType: "developer tool",
      website: "https://postdiff.vercel.app",
      repository: "https://github.com/ankitdey01/postdiff",
      install: "npm i -g postdiff",
      workflow: ["generate", "review", "publish"],
      principles: [
        "draft-first",
        "human approval before publishing",
        "copy-only publishing",
        "local-first profile and draft storage",
      ],
    },
    { headers: apiHeaders() },
  );
}

export function capabilitiesResponse(): Response {
  return Response.json(
    {
      formats: ["x", "linkedin", "blog"],
      commands: [
        "postdiff setup",
        "postdiff context",
        "postdiff generate",
        "postdiff review",
        "postdiff publish",
        "postdiff voice",
        "postdiff reference",
        "postdiff preferences",
      ],
      generation: {
        significanceFilter: "Jev",
        providers: 10,
        webSearch: "opt-in",
      },
      publishing: {
        mode: "copy-only",
        autonomousPublishing: false,
      },
    },
    { headers: apiHeaders() },
  );
}

export function healthResponse(): Response {
  return Response.json(
    { status: "ok", service: "postdiff-web", version: API_VERSION },
    { headers: apiHeaders({ "Cache-Control": "no-store" }) },
  );
}
