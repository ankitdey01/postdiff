import { SITE_ORIGIN } from "../../site";

const MANIFEST = {
  name: "postdiff",
  displayName: "Postdiff",
  version: "0.0.1",
  description:
    "Read-only tools for discovering Postdiff capabilities and its local-first commit-to-post workflow.",
  endpoint: `${SITE_ORIGIN}/mcp`,
  transport: "streamable-http",
  tools: [
    {
      name: "get_product",
      description: "Get the product identity, workflow, install command, and principles.",
    },
    {
      name: "get_capabilities",
      description: "List supported post formats, CLI commands, generation, and publishing behavior.",
    },
  ],
  documentation: `${SITE_ORIGIN}/docs`,
  openapi: `${SITE_ORIGIN}/openapi.json`,
};

export function GET(): Response {
  return Response.json(MANIFEST, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
