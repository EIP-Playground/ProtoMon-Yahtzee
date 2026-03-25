import { NextResponse } from "next/server";

export function notImplemented(route: string) {
  return NextResponse.json(
    {
      ok: false,
      route,
      message: "Not implemented yet.",
    },
    {
      status: 501,
    },
  );
}
