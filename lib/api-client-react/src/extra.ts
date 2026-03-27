import { customFetch } from "./custom-fetch";

export interface AppComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  fromUser: string;
  fromUserAvatar?: string | null;
  postId?: string | null;
  postImageData?: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export const listComments = (postId: string): Promise<AppComment[]> =>
  customFetch(`/api/posts/${postId}/comments`);

export const addComment = (postId: string, text: string): Promise<AppComment> =>
  customFetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const deleteComment = (postId: string, commentId: string): Promise<void> =>
  customFetch(`/api/posts/${postId}/comments/${commentId}`, { method: "DELETE" });

export const toggleSave = (postId: string): Promise<{ saved: boolean }> =>
  customFetch(`/api/posts/${postId}/save`, { method: "POST" });

export const listSavedIds = (): Promise<string[]> =>
  customFetch(`/api/saved`);

export const listNotifications = (): Promise<AppNotification[]> =>
  customFetch(`/api/notifications`);

export const markNotificationsRead = (): Promise<void> =>
  customFetch(`/api/notifications/read-all`, { method: "POST" });
