/** Copy a line for the user to hand to their agent. Returns false if blocked. */
export async function copyPrompt(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
