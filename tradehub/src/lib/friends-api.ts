// src/lib/friends-api.ts
import { apiRequest } from "@/lib/api";

// How I am connected to another user. It depends on who sent the request:
//   None             no request either way        -> show "Add friend"
//   RequestSent      I sent one, it is waiting    -> show "Request sent"
//   RequestReceived  they sent me one             -> show "Accept" / "Decline"
//   Friends                                       -> show "Friends"
export type FriendStatus = "None" | "RequestSent" | "RequestReceived" | "Friends";

// requestId is the request itself (needed to accept or decline); null when status is None.
export interface FriendInfo {
  status: FriendStatus;
  requestId: string | null;
}

// A friend request I received (FriendRequestDto): the request itself plus who sent it.
export interface FriendRequest {
  id: string;        // the request: use it to accept or decline
  userId: string;    // the person who sent it
  name: string;
  uniqueName: string;
  avatar: string;    // "" when the user has no avatar
  location: string;  // "" when not set
  createdAt: string; // ISO date
}

// GET /api/friends/status/{userId}
export async function fetchFriendStatus(userId: string): Promise<FriendInfo> {
  const res = await apiRequest(`/api/friends/status/${userId}`);
  return (await res.json()) as FriendInfo;
}

// GET /api/friends/requests/received: requests other people sent me that are still waiting, newest first
export async function fetchReceivedRequests(): Promise<FriendRequest[]> {
  const res = await apiRequest("/api/friends/requests/received");
  return (await res.json()) as FriendRequest[];
}

// GET /api/friends/requests/unseen-count: waiting requests I have not looked at yet (the badge on the Friends icon)
export async function fetchUnseenCount(): Promise<number> {
  const res = await apiRequest("/api/friends/requests/unseen-count");
  return (await res.json()) as number;
}

// PUT /api/friends/requests/seen: 204 No Content. Called when the Friends page opens; the requests stay in the list.
export async function markRequestsSeen(): Promise<void> {
  await apiRequest("/api/friends/requests/seen", { method: "PUT" });
}

// POST /api/friends/requests/{userId}: returns the new status (RequestSent)
export async function sendFriendRequest(userId: string): Promise<FriendInfo> {
  const res = await apiRequest(`/api/friends/requests/${userId}`, { method: "POST" });
  return (await res.json()) as FriendInfo;
}

// PUT /api/friends/requests/{requestId}/accept: 204 No Content. Only the receiver can accept.
export async function acceptFriendRequest(requestId: string): Promise<void> {
  await apiRequest(`/api/friends/requests/${requestId}/accept`, { method: "PUT" });
}

// DELETE /api/friends/requests/{requestId}: 204 No Content. Decline (receiver) or cancel (sender).
export async function deleteFriendRequest(requestId: string): Promise<void> {
  await apiRequest(`/api/friends/requests/${requestId}`, { method: "DELETE" });
}
