// src/lib/notifications-api.ts
import { apiRequest } from "@/lib/api";

// What happened. Comments will be added here later.
export type NotificationType = "FriendRequestReceived" | "FriendRequestAccepted";

// One line of the bell list (NotificationDto). Named AppNotification because the browser
// already has its own global `Notification` type.
export interface AppNotification {
  id: string;
  type: NotificationType;
  actorId: string;        // the person who did it (sent or accepted the request)
  actorName: string;
  actorUniqueName: string;
  actorAvatar: string;    // "" when the user has no avatar
  isRead: boolean;
  createdAt: string;      // ISO date
}

// GET /api/notifications: my latest notifications, newest first
export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await apiRequest("/api/notifications");
  return (await res.json()) as AppNotification[];
}

// GET /api/notifications/unread-count: the red number on the bell
export async function fetchUnreadCount(): Promise<number> {
  const res = await apiRequest("/api/notifications/unread-count");
  return (await res.json()) as number;
}

// PUT /api/notifications/read-all: 204 No Content. Called when the bell is opened.
export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("/api/notifications/read-all", { method: "PUT" });
}
