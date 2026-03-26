import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  FlatList,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, listPosts } from "@workspace/api-client-react";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 3) / 3;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const { data: posts } = useQuery({
    queryKey: ["posts"],
    queryFn: () => listPosts(),
  });

  const myPosts = (posts ?? []).filter((p) => p.userId === "user-001");

  const STATS = [
    { label: "Posts", value: myPosts.length },
    { label: "Followers", value: profile?.followersCount ?? 0 },
    { label: "Following", value: profile?.followingCount ?? 0 },
  ];

  if (profileLoading) {
    return (
      <View style={[styles.centered, { paddingTop: topPadding }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable onPress={() => router.push("/edit-profile")} testID="edit-profile-btn">
          <Feather name="settings" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!myPosts.length}
        numColumns={3}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            <View style={styles.avatarRow}>
              {profile?.avatarData ? (
                <Image
                  source={{ uri: `data:image/png;base64,${profile.avatarData}` }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarLetter}>
                    {(profile?.displayName ?? "P").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.statsRow}>
                {STATS.map((stat) => (
                  <View key={stat.label} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.displayName}>{profile?.displayName ?? "Pet Lover"}</Text>
            <Text style={styles.username}>@{profile?.username ?? "petlover"}</Text>
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <Pressable
              onPress={() => router.push("/edit-profile")}
              style={styles.editBtn}
              testID="edit-profile-btn-2"
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.gridHeader}>
              <Feather name="grid" size={20} color={Colors.text} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.gridItem} testID={`grid-post-${item.id}`}>
            <Image
              source={{ uri: `data:image/png;base64,${item.imageData}` }}
              style={styles.gridImage}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="image" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Create your first AI pet portrait!</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text,
  },
  profileSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    gap: 20,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: Colors.textInverse,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  displayName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
    paddingHorizontal: 4,
  },
  username: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  editBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 14,
    marginHorizontal: 4,
  },
  editBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.borderLight,
    marginTop: 16,
  },
  gridHeader: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 0.5,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.surfaceSecondary,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: Colors.text,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
