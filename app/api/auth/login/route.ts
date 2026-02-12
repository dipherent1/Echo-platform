import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/services/user-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    const { user, token } = await loginUser(username, password);

    return NextResponse.json({
      success: true,
      userId: user._id.toString(),
      token,
      hasOnboarded: user.hasOnboarded || false,
      message: "Login successful. This is your API token.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    logger.error("Login failed", { meta: { error: message } });

    if (message === "Invalid credentials") {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
