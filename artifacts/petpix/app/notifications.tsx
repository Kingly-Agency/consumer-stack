import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationsRead } from "@workspace/api-client-react";
import type { AppNotification } from "@workspace/api-client-react";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationItem({ item }: { item: AppNotification }) {
  const isLike = item.type === "like";

  return (
    <Pressable
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => {
        if (item.postId) {
          router.push(`/post/${item.postId}` as never);
        }
      }}
    >
      {/* Unread dot */}
      {!item.read && <View style={styles.unreadDot} />}

      {/* Avatar */}
      <View style={[styles.avatarWrap, isLike ? styles.avatarLike : styles.avatarComment]}>
        {item.fromUserAvatar ? (
          <Image
            source={{ uri: `data:image/png;base64,${item.fromUserAvatar}` }}
            style={styles.avatarImg}
          />
        ) : (
          <Text style={styles.avatarLetter}>{item.fromUser.charAt(0).toUpperCase()}</Text>
        )}
        <View style={[styles.typeIcon, isLike ? styles.typeIconLike : styles.typeIconComment]}>
          <Text style={styles.typeIconText}>{isLike ? "❤️" : "💬"}</Text>
        </View>
      </View>

      {/* Message */}
      <View style={styles.messageWrap}>
        <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
      </View>

      {/* Post thumbnail */}
      {item.postImageData ? (
        <Image
          source={{ uri: `data:image/png;base64,${item.postImageData}` }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailPlaceholderText}>🐾</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 16 : insets.top;
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });

  const readMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    const hasUnread = notifications?.some((n) => !n.read);
    if (hasUnread) {
      const timer = setTimeout(() => {
        readMutation.mutate();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <View style={styles.container}>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: topPadding + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.navTitleRow}>
          <Text style={styles.navTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.navRight} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>When people like or comment on your portraits, you'll see it here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  navRight: {
    width: 38,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    color: Colors.text,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.borderLight,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    gap: 12,
  },
  itemUnread: {
    backgroundColor: Colors.primaryLighter,
  },
  unreadDot: {
    position: "absolute",
    left: 6,
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: -3,
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    flexShrink: 0,
  },
  avatarLike: {
    backgroundColor: "#FFE0E8",
  },
  avatarComment: {
    backgroundColor: Colors.primaryLighter,
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.primary,
  },
  typeIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  typeIconLike: {
    backgroundColor: "#FF3366",
  },
  typeIconComment: {
    backgroundColor: Colors.primary,
  },
  typeIconText: {
    fontSize: 9,
  },
  messageWrap: {
    flex: 1,
    gap: 3,
  },
  messageText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 19,
  },
  timeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    flexShrink: 0,
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  thumbnailPlaceholderText: {
    fontSize: 22,
  },
});
