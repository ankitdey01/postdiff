import assert from "node:assert/strict";
import process from "node:process";

const origin = process.env.AGENT_TEST_ORIGIN ?? "http://127.0.0.1:3000";

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/health`);
      if (response.ok) return;
    } catch {
      // The Next server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Web server did not start at ${origin}.`);
}

function contentType(response) {
  return response.headers.get("content-type") ?? "";
}

function varyHeader(response) {
  return response.headers.get("vary") ?? "";
}

await waitForServer();

  const markdownHome = await fetch(`${origin}/`, {
    headers: { Accept: "text/markdown" },
  });
  assert.equal(markdownHome.status, 200);
  assert.match(contentType(markdownHome), /^text\/markdown/i);
  assert.match(varyHeader(markdownHome), /accept/i);
  assert.ok((await markdownHome.text()).length > 20);

  const htmlHome = await fetch(`${origin}/`, {
    headers: { Accept: "text/html" },
  });
  assert.equal(htmlHome.status, 200);
  assert.match(contentType(htmlHome), /^text\/html/i);
  assert.match(varyHeader(htmlHome), /accept/i);
  const htmlHomeBody = await htmlHome.text();
  assert.match(htmlHomeBody, /application\/ld\+json/);
  assert.match(htmlHomeBody, /rel="canonical"/);
  assert.match(htmlHomeBody, /og:type/);

  const aboutPage = await fetch(`${origin}/about`, {
    headers: { Accept: "text/html" },
  });
  assert.match(await aboutPage.text(), /rel="canonical"[^>]+\/about/);

  const docsPage = await fetch(`${origin}/docs`, {
    headers: { Accept: "text/html" },
  });
  assert.match(await docsPage.text(), /rel="canonical"[^>]+\/docs/);

  const lessPreferredMarkdown = await fetch(`${origin}/`, {
    headers: { Accept: "text/markdown;q=0.2, text/*;q=0.8" },
  });
  assert.match(contentType(lessPreferredMarkdown), /^text\/html/i);

  const markdown404 = await fetch(`${origin}/__agent-readiness-missing`, {
    headers: { Accept: "text/markdown" },
  });
  assert.equal(markdown404.status, 404);
  assert.match(contentType(markdown404), /^text\/markdown/i);
  const markdown404Body = await markdown404.text();
  assert.ok(markdown404Body.length > 20);
  assert.match(markdown404Body, /\/docs|\/sitemap\.xml|\/llms\.txt/);

  const openapi = await fetch(`${origin}/openapi.json`);
  assert.equal(openapi.status, 200);
  assert.match(contentType(openapi), /application\/json/i);
  const openapiDocument = await openapi.json();
  assert.equal(openapiDocument.openapi, "3.1.0");
  assert.ok(openapiDocument.paths["/api/v1/capabilities"].get.operationId);

  const product = await fetch(`${origin}/api/v1/product`);
  assert.equal(product.status, 200);
  assert.equal((await product.json()).name, "Postdiff");

  const api404 = await fetch(`${origin}/api/v1/does-not-exist`);
  assert.equal(api404.status, 404);
  const api404Body = await api404.json();
  assert.equal(api404Body.error.code, "NOT_FOUND");
  assert.ok(api404Body.error.hint);

  const genericApi404 = await fetch(`${origin}/api/does-not-exist`);
  assert.equal(genericApi404.status, 404);
  assert.equal((await genericApi404.json()).error.code, "NOT_FOUND");

  const sitemap = await fetch(`${origin}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  const sitemapBody = await sitemap.text();
  assert.match(sitemapBody, /<lastmod>/);
  assert.match(sitemapBody, /<loc>.*\/about<\/loc>/);

  const llms = await fetch(`${origin}/llms.txt`);
  assert.equal(llms.status, 200);
  assert.match(await llms.text(), /## When to use Postdiff/);

  const manifest = await fetch(`${origin}/.well-known/mcp`);
  assert.equal(manifest.status, 200);
  const manifestBody = await manifest.json();
  assert.equal(manifestBody.transport, "streamable-http");
  assert.equal(new URL(manifestBody.endpoint).pathname, "/mcp");

  const mcpOptions = await fetch(`${origin}/mcp`, { method: "OPTIONS" });
  assert.equal(mcpOptions.status, 204);
  assert.match(mcpOptions.headers.get("access-control-allow-origin") ?? "", /\*/);
  assert.match(mcpOptions.headers.get("access-control-allow-methods") ?? "", /POST/);
  assert.match(mcpOptions.headers.get("access-control-allow-headers") ?? "", /MCP-Protocol-Version/);

  const initialize = await fetch(`${origin}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    }),
  });
  assert.equal(initialize.status, 200);
  const initializeBody = await initialize.json();
  assert.equal(initializeBody.result.serverInfo.name, "postdiff");
  assert.equal(initializeBody.result.protocolVersion, "2025-06-18");

  const unsupportedVersion = await fetch(`${origin}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "initialize",
      params: { protocolVersion: "2099-01-01" },
    }),
  });
  assert.equal((await unsupportedVersion.json()).result.protocolVersion, "2025-06-18");

  for (const invalidRequest of [
    null,
    { jsonrpc: "2.0", method: "initialize" },
    { jsonrpc: "1.0", id: 3, method: "initialize" },
  ]) {
    const invalidResponse = await fetch(`${origin}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidRequest),
    });
    assert.equal((await invalidResponse.json()).error.code, -32600);
  }

console.log("Agent readiness checks passed");
