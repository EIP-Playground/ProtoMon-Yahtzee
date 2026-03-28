import { NextResponse } from "next/server";

import { isBytes32Hex, isHexAddress } from "@/lib/server/validation";
import type { HexAddress, HexString } from "@/types/game";

export class ApiRouteError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRouteError";
  }
}

export async function readJsonObject(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiRouteError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiRouteError(400, "INVALID_JSON", "Request body must be a JSON object.");
  }

  return body as Record<string, unknown>;
}

export function requireStringField(body: Record<string, unknown>, fieldName: string) {
  const value = body[fieldName];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiRouteError(
      400,
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be a non-empty string.`,
    );
  }

  return value.trim();
}

export function requireIntegerField(body: Record<string, unknown>, fieldName: string) {
  const value = body[fieldName];

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ApiRouteError(
      400,
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be an integer.`,
    );
  }

  return value;
}

export function requireAddressField(body: Record<string, unknown>, fieldName: string) {
  const value = requireStringField(body, fieldName);

  if (!isHexAddress(value)) {
    throw new ApiRouteError(
      400,
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be a valid 0x-prefixed address.`,
    );
  }

  return value as HexAddress;
}

export function requireGameIdField(body: Record<string, unknown>, fieldName: string) {
  const value = requireStringField(body, fieldName);

  if (!isBytes32Hex(value)) {
    throw new ApiRouteError(
      400,
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be a valid 32-byte hex string.`,
    );
  }

  return value as HexString;
}

export function requireTxHashField(body: Record<string, unknown>, fieldName: string) {
  const value = requireStringField(body, fieldName);

  if (!isBytes32Hex(value)) {
    throw new ApiRouteError(
      400,
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be a valid 32-byte transaction hash.`,
    );
  }

  return value as HexString;
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.status,
      },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error.",
      },
    },
    {
      status: 500,
    },
  );
}
