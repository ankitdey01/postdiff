import {
  capabilitiesResponse,
  jsonError,
  productResponse,
} from "../lib/api";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const SUPPORTED_PROTOCOL_VERSION = "2025-06-18";
const MCP_HEADERS = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version",
  "MCP-Protocol-Version": SUPPORTED_PROTOCOL_VERSION,
};

const TOOLS = [
  {
    name: "get_product",
    description: "Get Postdiff product identity and its draft-first workflow.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_capabilities",
    description: "List Postdiff formats, commands, generation, and publishing behavior.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
] as const;

function rpcResult(id: JsonRpcRequest["id"], result: unknown): Response {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, result },
    { headers: MCP_HEADERS },
  );
}

function rpcError(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
): Response {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status: 200, headers: MCP_HEADERS },
  );
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const id = candidate.id;
  return (
    candidate.jsonrpc === "2.0" &&
    Object.prototype.hasOwnProperty.call(candidate, "id") &&
    (typeof id === "string" || typeof id === "number" || id === null)
  );
}

async function responseData(response: Response): Promise<unknown> {
  return response.json();
}

export async function POST(request: Request): Promise<Response> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return rpcError(null, -32700, "Invalid JSON-RPC request.");
  }

  if (!isJsonRpcRequest(parsed)) {
    return rpcError(
      null,
      -32600,
      'Invalid Request: expected a JSON-RPC 2.0 object with an id.',
    );
  }

  const body = parsed;
  if (!body.method) {
    return rpcError(body.id, -32600, "The JSON-RPC method is required.");
  }

  if (body.method.startsWith("notifications/")) {
    return new Response(null, { status: 202, headers: MCP_HEADERS });
  }

  switch (body.method) {
    case "initialize": {
      const requestedProtocolVersion = body.params?.protocolVersion;
      return rpcResult(body.id, {
        protocolVersion:
          requestedProtocolVersion === SUPPORTED_PROTOCOL_VERSION
            ? requestedProtocolVersion
            : SUPPORTED_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "postdiff", version: "0.0.1" },
      });
    }
    case "tools/list":
      return rpcResult(body.id, { tools: TOOLS });
    case "tools/call": {
      const name = body.params?.name;
      if (name !== "get_product" && name !== "get_capabilities") {
        return rpcError(body.id, -32602, "Unknown Postdiff tool.");
      }

      const data = await responseData(
        name === "get_product" ? productResponse() : capabilitiesResponse(),
      );
      return rpcResult(body.id, {
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: data,
      });
    }
    default:
      return rpcError(body.id, -32601, `Unknown MCP method: ${body.method}`);
  }
}

export function GET(): Response {
  return jsonError(
    405,
    "METHOD_NOT_ALLOWED",
    "The Postdiff MCP endpoint accepts Streamable HTTP POST requests.",
    "Read /.well-known/mcp for the manifest and send JSON-RPC requests to /mcp.",
  );
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: MCP_HEADERS });
}
