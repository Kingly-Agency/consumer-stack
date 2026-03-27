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

const COVER_HEIGHT = 130;

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Cover band with pattern */}
            <View style={[styles.coverBand, { paddingTop: topPadding }]}>
              {/* Decorative circles */}
              <View style={[styles.coverCircle, { top: -20, right: 40, width: 120, height: 120, opacity: 0.12 }]} />
              <View style={[styles.coverCircle, { top: 10, right: -20, width: 80, height: 80, opacity: 0.08 }]} />
              <View style={[styles.coverCircle, { top: -10, left: 60, width: 60, height: 60, opacity: 0.1 }]} />
              {/* Nav */}
              <View style={styles.navBar}>
                <Text style={styles.navTitle}>My Profile</Text>
                <Pressable
                  onPress={() => router.push("/edit-profile")}
                  style={styles.settingsBtn}
                  testID="edit-profile-btn"
                >
                  <Feather name="settings" size={17} color={Colors.primary} />
                </Pressable>
              </View>
            </View>

            {/* Profile body */}
            <View style={styles.profileBody}>
              {/* Avatar overlapping cover */}
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
                <Pressable
                  style={styles.editAvatarBadge}
                  onPress={() => router.push("/edit-profile")}
                >
                  <Feather name="camera" size={11} color="#fff" />
                </Pressable>
              </View>

              <Text style={styles.displayName}>{profile?.displayName ?? "Pet Lover"}</Text>
              <Text style={styles.username}>@{profile?.username ?? "petlover"}</Text>
              {profile?.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : (
                <Pressable onPress={() => router.push("/edit-profile")}>
                  <Text style={styles.addBioPrompt}>+ Add a bio</Text>
                </Pressable>
              )}

              {/* Stats */}
              <View style={styles.statsRow}>
                {STATS.map((stat, i) => (
                  <React.Fragment key={stat.label}>
                    <Pressable style={styles.statItem}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </Pressable>
                    {i < STATS.length - 1 && <View style={styles.statDivider} />}
                  </React.Fragment>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => router.push("/edit-profile")}
                  style={styles.editBtn}
                  testID="edit-profile-btn-2"
                >
                  <Feather name="edit-2" size={14} color={Colors.primary} />
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </Pressable>
                <Pressable style={styles.shareBtn}>
                  <Feather name="share-2" size={14} color={Colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {/* Grid tab */}
            <View style={styles.gridTabRow}>
              <View style={styles.gridTabActive}>
                <Feather name="grid" size={15} color={Colors.primary} />
                <Text style={styles.gridTabText}>
                  {myPosts.length > 0 ? `${myPosts.length} Portrait${myPosts.length !== 1 ? "s" : ""}` : "Portraits"}
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridItem}
            onPress={() => router.push(`/post/${item.id}`)}
            testID={`grid-post-${item.id}`}
          >
            <Image
              source={{ uri: `data:image/png;base64,${item.imageData}` }}
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Feather name="heart" size={11} color="#fff" />
              <Text style={styles.gridLikes}>{item.likes}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBg}>
              <Text style={styles.emptyEmoji}>🎨</Text>
            </View>
            <Text style={styles.emptyTitle}>No portraits yet</Text>
            <Text style={styles.emptyText}>
              Create your first AI pet portrait and it'll appear here!
            </Text>
            <Pressable onPress={() => router.push("/create")} style={styles.emptyBtn}>
              <Feather name="zap" size={15} color="#fff" />
              <Text style={styles.emptyBtnText}>Create now</Text>
            </Pressable>
          </View>
        }
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
  listContent: {
    paddingBottom: 110,
  },
  coverBand: {
    height: COVER_HEIGHT,
    backgroundColor: Colors.primaryLighter,
    position: "relative",
    overflow: "hidden",
  },
  coverCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: Colors.primary,
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
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileBody: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  avatarWrapper: {
    marginTop: -48,
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    fontSize: 36,
    color: Colors.textInverse,
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
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
    marginBottom: 6,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  addBioPrompt: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginTop: 14,
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
    height: 30,
    backgroundColor: Colors.border,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    marginBottom: 8,
    width: "100%",
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: 10,
    backgroundColor: Colors.primaryLighter,
  },
  editBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  gridTabRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
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
    bottom: 5,
    left: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  gridLikes: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#fff",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 36,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 50,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
