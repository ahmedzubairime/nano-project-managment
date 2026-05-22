import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalizedValue(jsonOrText: string | null | undefined, locale: string): string {
  if (!jsonOrText) return "";
  try {
    const parsed = JSON.parse(jsonOrText);
    if (parsed && typeof parsed === "object") {
      return parsed[locale] || parsed["en"] || jsonOrText;
    }
  } catch (e) {
    // Not JSON
  }
  return jsonOrText;
}
