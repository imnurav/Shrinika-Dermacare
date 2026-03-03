import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";
const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
const DEBUG_AUTH_LOGS = process.env.DEBUG_AUTH_LOGS === "true";

function buildTargetUrl(pathSegments: string[], incomingUrl: string): string {
  const safeBase = BACKEND_URL.endsWith("/")
    ? BACKEND_URL.slice(0, -1)
    : BACKEND_URL;
  const path = pathSegments.join("/");
  const url = new URL(`${safeBase}/${path}`);
  const incoming = new URL(incomingUrl);
  incoming.searchParams.forEach((value, key) =>
    url.searchParams.append(key, value),
  );
  return url.toString();
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const target = buildTargetUrl(pathSegments, request.url);
  const outgoingHeaders = new Headers();
  const incomingAuthHeader = request.headers.get("authorization");

  request.headers.forEach((value, key) => {
    const lowered = key.toLowerCase();
    if (lowered === "host" || lowered === "content-length") return;
    outgoingHeaders.set(key, value);
  });
  if (DEBUG_AUTH_LOGS) {
    console.log("[proxy] request", {
      method: request.method,
      path: `/${pathSegments.join("/")}`,
      hasIncomingAuthorization: Boolean(incomingAuthHeader),
      hasForwardedAuthorization: Boolean(outgoingHeaders.get("authorization")),
      target,
    });
  }

  const init: RequestInit = {
    method: request.method,
    headers: outgoingHeaders,
    cache: "no-store",
  };

  if (!METHODS_WITHOUT_BODY.has(request.method.toUpperCase())) {
    init.body = await request.arrayBuffer();
  }

  const backendResponse = await fetch(target, init);
  const responseHeaders = new Headers();

  backendResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-encoding") return;
    responseHeaders.set(key, value);
  });

  if (DEBUG_AUTH_LOGS) {
    console.log("[proxy] response", {
      method: request.method,
      path: `/${pathSegments.join("/")}`,
      status: backendResponse.status,
      ok: backendResponse.ok,
    });
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
