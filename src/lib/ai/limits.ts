// How many messages one user can send to Gym Tracker AI per day. Exists so
// one person burning through the shared free Gemini/Groq quota doesn't lock
// everyone else out of the chat for the rest of the day.
export const DAILY_MESSAGE_LIMIT = Number(process.env.AI_DAILY_MESSAGE_LIMIT) || 30;
