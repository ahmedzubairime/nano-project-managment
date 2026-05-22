import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { Role } from "@/types/roles";
import { chatCompletion, type ChatMessage } from "@/services/ai/openrouter";
import { buildFullProjectContext } from "@/services/ai/context-builders";
import { buildSystemPrompt } from "@/services/ai/prompts/system-prompt";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ai/chat
 *
 * Accepts a projectId and conversation messages.
 * Enforces authentication, PROJECT_MANAGER role, and project membership.
 * Injects project context and returns the assistant response.
 */
export async function POST(request: Request) {
  try {
    // 1. Authentication
    const dbUser = await getOrCreateDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // 2. Role check — PROJECT_MANAGER only
    if (dbUser.role !== Role.PROJECT_MANAGER) {
      return NextResponse.json(
        { error: "Access denied. Only Project Managers can use the AI assistant." },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { projectId, messages } = body as {
      projectId?: string;
      messages?: { role: string; content: string }[];
    };

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // 4. Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // 5. Build project context and system prompt
    const projectContext = await buildFullProjectContext(projectId);
    const systemPrompt = buildSystemPrompt(projectContext);

    // 6. Prepare messages for OpenRouter
    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages
        .filter(
          (m) =>
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim() !== ""
        )
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content.trim(),
        })),
    ];

    // 7. Call OpenRouter
    const result = await chatCompletion(chatMessages);

    return NextResponse.json({
      response: result.response,
      model: result.model,
    });
  } catch (error: any) {
    console.error("[AI Chat API] Error:", error);

    // Friendly error for missing API key
    if (error.message?.includes("OPENROUTER_API_KEY")) {
      return NextResponse.json(
        { error: "AI service is not configured. Contact your administrator." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
