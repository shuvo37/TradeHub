// src/lib/search-api.ts
import { apiRequest } from "@/lib/api";
import type { FriendStatus } from "@/lib/friends-api";

// One search result, exactly as the backend sends it (UserSummaryDto).
export interface UserSummary {
  id: string;
  name: string;
  uniqueName: string;
  avatar: string; // "" when the user has no avatar
  location: string; // "" when not set
  friendStatus: FriendStatus; // how I am connected to this person (decides the button on the row)
  requestId: string | null;   // the friend request between us, null when there is none
}

// GET /api/users/search?q=...
// A normal name ("rahim") lists every account whose name contains it; a full unique name
// ("Rahim_x7k") finds exactly that account. Never includes me. At most 20 results.
export async function searchUsers(text: string): Promise<UserSummary[]> {
  const res = await apiRequest(`/api/users/search?q=${encodeURIComponent(text)}`);
  return (await res.json()) as UserSummary[];
}
