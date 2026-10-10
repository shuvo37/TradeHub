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

// One person in my friends list (FriendDto)
export interface Friend {
  userId: string;    // the friend: use it to open the profile or to unfriend
  name: string;
  uniqueName: string;
  avatar: string;    // "" when the user has no avatar
  location: string;  // "" when not set
}

// One page (10) of my friends, newest first. nextCursor is sent back as `before` to get the next page.
export interface FriendsPage {
  items: Friend[];
  hasMore: boolean;
  nextCursor: string | null;
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

// GET /api/friends?before=<cursor>: my friends, 10 per page. Omit `before` for the first page.
// The cursor is sent back exactly as received, URL-encoded.
export async function fetchFriends(before?: string): Promise<FriendsPage> {
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  const res = await apiRequest(`/api/friends${query}`);
  return (await res.json()) as FriendsPage;
}

// DELETE /api/friends/{userId}: 204 No Content. Removes the friendship ({userId} is the friend, not a request id).
export async function unfriend(userId: string): Promise<void> {
  await apiRequest(`/api/friends/${userId}`, { method: "DELETE" });
}
