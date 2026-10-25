import { NextRequest, NextResponse } from "next/server";

const KNOWN_DOCUMENT_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/docs",
  "/pricing",
  "/privacy",
  "/tos",
  "/health",
  "/openapi.json",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/.well-known/mcp",
  "/mcp",
]);

function markdownIsPreferred(request: NextRequest): boolean {
  const accept = request.headers.get("accept");
  if (!accept) return false;

  const ranges = accept.split(",").map((part) => {
    const [mediaType, ...parameters] = part.trim().toLowerCase().split(";");
    const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
    const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
    return { mediaType, quality: Number.isFinite(quality) ? quality : 0 };
  });

  const effectiveQuality = (target: string): number => {
    const [targetType] = target.split("/");
    const matchingRanges = ranges
      .map((range, index) => {
        const [rangeType, rangeSubtype] = range.mediaType.split("/");
        const specificity =
          range.mediaType === target
            ? 2
            : rangeType === targetType && rangeSubtype === "*"
              ? 1
              : range.mediaType === "*/*"
                ? 0
                : -1;
        return { ...range, index, specificity };
      })
      .filter((range) => range.specificity >= 0)
      .sort((left, right) => right.specificity - left.specificity || left.index - right.index);

    return matchingRanges[0]?.quality ?? 0;
  };

  const markdown = effectiveQuality("text/markdown");
  const html = effectiveQuality("text/html");

  return markdown > 0 && markdown >= html;
}

function markdownHome(origin: string): string {
  return `# Postdiff

Postdiff is a local-first developer tool that turns meaningful git commits into reviewable posts in your voice. It filters trivial changes, drafts for X, LinkedIn, and blogs, and requires human approval before anything is published.

## When to use Postdiff

Use Postdiff when a developer wants to explain a meaningful code change, create a build-in-public update from a commit, preserve a personal writing voice, or draft social content without giving a hosted service access to a private repository.

Do not use Postdiff for autonomous publishing, platform account automation, or replacing human review. Publishing is copy-only by design.

## Agent entry points

- [Documentation](${origin}/docs)
- [Machine-readable instructions](${origin}/llms.txt)
- [OpenAPI specification](${origin}/openapi.json)
- [Public API](${origin}/api/v1)
- [Sitemap](${origin}/sitemap.xml)
- [MCP manifest](${origin}/.well-known/mcp)

## Quick start

~~~bash
npm i -g postdiff
postdiff setup
postdiff generate
postdiff review
postdiff publish
~~~

Postdiff: turn finished work into posts that sound like you wrote them.
`;
}

function markdownNotFound(origin: string, path: string): string {
  return `# Page not found

The requested Postdiff page "${path}" does not exist. Check the [documentation](${origin}/docs), [sitemap](${origin}/sitemap.xml), or [agent instructions](${origin}/llms.txt) for valid resources.
`;
}

export function proxy(request: NextRequest): NextResponse {
  if (!markdownIsPreferred(request)) {
    const response = NextResponse.next();
    response.headers.set("Vary", "Accept");
    return response;
  }

  const pathname = request.nextUrl.pathname;
  if (pathname === "/") {
    return new NextResponse(markdownHome(request.nextUrl.origin), {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  }

  if (pathname.startsWith("/api/") || KNOWN_DOCUMENT_PATHS.has(pathname)) {
    const response = NextResponse.next();
    response.headers.set("Vary", "Accept");
    return response;
  }

  return new NextResponse(markdownNotFound(request.nextUrl.origin, pathname), {
    status: 404,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
