/**
 * OpenRouter provider abstraction for AI chat completions.
 *
 * Sends requests to the OpenRouter API and returns assistant responses.
 * Uses OPENROUTER_API_KEY from environment — never exposed client-side.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  response: string;
  model: string;
}

/**
 * Send a chat completion request to OpenRouter.
 *
 * @param messages - The full conversation message array (including system prompt).
 * @param model - Optional model override. Defaults to google/gemini-2.5-flash.
 * @returns The assistant's response text and the model used.
 * @throws Error if API key is missing or the request fails.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it in your environment variables."
    );
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Field Project Management System",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    console.error(
      `[OpenRouter] API request failed (${res.status}):`,
      errorBody
    );
    throw new Error(
      `AI provider returned an error (${res.status}). Please try again.`
    );
  }

  const data = await res.json();

  const assistantMessage = data?.choices?.[0]?.message?.content;

  if (!assistantMessage || typeof assistantMessage !== "string") {
    console.error("[OpenRouter] Unexpected response structure:", data);
    throw new Error("Received an unexpected response from the AI provider.");
  }

  return {
    response: assistantMessage.trim(),
    model: data?.model || model,
  };
}
