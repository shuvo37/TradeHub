// src/lib/profile-api.ts
import { apiRequest, jsonInit } from "@/lib/api";
import type { UserProfile } from "@/types/profile";

// The user as the backend sends it (UserDto). Optional fields are never null, so the UI can call .trim() on them.
interface UserDto {
  id: string;
  name: string;
  uniqueName: string;
  avatar: string;
  location: string;
  paymentNumber: string;
  email: string;
  phone: string;
  necessaryInfo: string;
}

const toProfile = (dto: UserDto): UserProfile => ({
  name: dto.name,
  uniqueName: dto.uniqueName,
  avatar: dto.avatar,
  location: dto.location,
  paymentNumber: dto.paymentNumber,
  email: dto.email,
  phone: dto.phone,
  necessaryInfo: dto.necessaryInfo,
});

// GET /api/users/me
export async function fetchMe(): Promise<UserProfile> {
  const res = await apiRequest("/api/users/me");
  return toProfile((await res.json()) as UserDto);
}

// PUT /api/users/me. Sends only what the backend lets you change (no uniqueName: the server builds it
// from the name). Returns the saved profile, including the new uniqueName if the name changed.
export async function updateMe(profile: UserProfile): Promise<UserProfile> {
  const res = await apiRequest(
    "/api/users/me",
    jsonInit("PUT", {
      name: profile.name,
      avatar: profile.avatar,
      location: profile.location,
      paymentNumber: profile.paymentNumber,
      email: profile.email,
      phone: profile.phone,
      necessaryInfo: profile.necessaryInfo,
    })
  );
  return toProfile((await res.json()) as UserDto);
}
