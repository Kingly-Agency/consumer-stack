import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Platform,
  FlatList,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
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
      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View>
            {/* Cover gradient header */}
            <View style={[styles.coverBand, { paddingTop: topPadding }]}>
              <View style={styles.coverGradientOverlay} />
              <View style={styles.navBar}>
                <Text style={styles.navTitle}>Profile</Text>
                <Pressable
                  onPress={() => router.push("/edit-profile")}
                  style={styles.settingsBtn}
                  testID="edit-profile-btn"
                >
                  <Feather name="settings" size={18} color={Colors.text} />
                </Pressable>
              </View>
            </View>

            <View style={styles.profileBody}>
              {/* Avatar — overlaps cover */}
              <View style={styles.avatarWrapper}>
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
                <View style={styles.verifiedBadge}>
                  <Feather name="star" size={10} color="#fff" />
                </View>
              </View>

              {/* Name / bio */}
              <Text style={styles.displayName}>{profile?.displayName ?? "Pet Lover"}</Text>
              <Text style={styles.username}>@{profile?.username ?? "petlover"}</Text>
              {profile?.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}

              {/* Stats row */}
              <View style={styles.statsRow}>
                {STATS.map((stat, i) => (
                  <React.Fragment key={stat.label}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                    {i < STATS.length - 1 && <View style={styles.statDivider} />}
                  </React.Fragment>
                ))}
              </View>

              {/* Edit button */}
              <Pressable
                onPress={() => router.push("/edit-profile")}
                style={styles.editBtn}
                testID="edit-profile-btn-2"
              >
                <Feather name="edit-2" size={14} color={Colors.primary} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </Pressable>
            </View>

            {/* Grid header */}
            <View style={styles.gridTabRow}>
              <View style={styles.gridTabActive}>
                <Feather name="grid" size={16} color={Colors.primary} />
                <Text style={styles.gridTabText}>Posts</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.gridItem} testID={`grid-post-${item.id}`}>
            <Image
              source={{ uri: `data:image/png;base64,${item.imageData}` }}
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Feather name="heart" size={12} color="#fff" />
              <Text style={styles.gridLikes}>{item.likes}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBg}>
              <Feather name="image" size={30} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No portraits yet</Text>
            <Text style={styles.emptyText}>Create your first AI pet portrait and it'll appear here.</Text>
            <Pressable
              onPress={() => router.push("/create")}
              style={styles.emptyBtn}
            >
              <Text style={styles.emptyBtnText}>Create now</Text>
            </Pressable>
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
  coverBand: {
    height: 120,
    backgroundColor: Colors.primaryLighter,
    position: "relative",
  },
  coverGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryLighter,
    opacity: 0.6,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  navTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileBody: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 4,
    alignItems: "center",
  },
  avatarWrapper: {
    marginTop: -42,
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: Colors.surface,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: Colors.textInverse,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  displayName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  username: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 0,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 9,
    marginTop: 14,
    marginBottom: 16,
  },
  editBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  gridTabRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 20,
  },
  gridTabActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  gridTabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 0.5,
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.surfaceSecondary,
  },
  gridOverlay: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  gridLikes: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  empty: {
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 50,
    marginTop: 4,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
