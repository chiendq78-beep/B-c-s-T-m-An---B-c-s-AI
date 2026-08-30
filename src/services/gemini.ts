export async function chatWithAI(
  message: string, 
  history: { role: "user" | "model"; parts: { text: string }[] }[] = []
): Promise<string> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Failed to chat with AI on backend proxy:", error);
    throw error;
  }
}

export async function identifyHerb(base64Image: string): Promise<string> {
  try {
    // Strip base64 header if it's there
    let cleanBase64 = base64Image;
    if (base64Image.includes(";base64,")) {
      cleanBase64 = base64Image.split(";base64,").pop() || base64Image;
    }

    const response = await fetch("/api/identify-herb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Image: cleanBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Failed to identify herb on backend proxy:", error);
    throw error;
  }
}

export interface SymptomHerbSuggestionPayload {
  symptoms?: string[];
  mood?: string;
  energy?: string;
  sleep?: number;
  notes?: string;
  vitals?: any;
}

export async function suggestHerbsForSymptoms(payload: SymptomHerbSuggestionPayload): Promise<string> {
  try {
    const response = await fetch("/api/suggest-herbs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Failed to suggest herbs from AI backend proxy:", error);
    throw error;
  }
}
