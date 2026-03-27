import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPosts, likePost } from "@workspace/api-client-react";
import { router } from "expo-router";
import { PostCard } from "@/components/PostCard";
import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import { ART_STYLES } from "@/components/StyleCard";

const PET_FILTERS = [
  { id: "all", label: "All", emoji: "🌍" },
  { id: "dog", label: "Dogs", emoji: "🐶" },
  { id: "cat", label: "Cats", emoji: "🐱" },
  { id: "bird", label: "Birds", emoji: "🐦" },
  { id: "rabbit", label: "Rabbits", emoji: "🐰" },
  { id: "other", label: "Other", emoji: "🐾" },
];

const SORT_OPTIONS = [
  { id: "recent", label: "Recent", icon: "clock" as const },
  { id: "popular", label: "Popular", icon: "trending-up" as const },
];

function CommunityEmptyState() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={emptyStyles.content}
    >
      {/* Illustration */}
      <View style={emptyStyles.illustrationCard}>
        <Text style={emptyStyles.illustrationEmojis}>🐶🐱🐰🐦</Text>
        <Text style={emptyStyles.illustrationTitle}>The community is quiet…</Text>
        <Text style={emptyStyles.illustrationSub}>
          Be the first to create and share an AI pet portrait with the world!
        </Text>
        <Pressable style={emptyStyles.ctaBtn} onPress={() => router.push("/create")}>
          <Feather name="zap" size={15} color="#fff" />
          <Text style={emptyStyles.ctaBtnText}>Create & Share</Text>
        </Pressable>
      </View>

      {/* Trending styles */}
      <View style={emptyStyles.section}>
        <Text style={emptyStyles.sectionTitle}>Popular styles to try</Text>
        <View style={emptyStyles.stylesGrid}>
          {ART_STYLES.slice(0, 4).map((s) => (
            <Pressable
              key={s.id}
              style={emptyStyles.styleCard}
              onPress={() => router.push("/create")}
            >
              <View style={emptyStyles.styleSwatchRow}>
                {s.colors.map((c, i) => (
                  <View
                    key={c}
                    style={[
                      emptyStyles.swatch,
                      { backgroundColor: c },
                      i === 0 && emptyStyles.swatchFirst,
                      i === s.colors.length - 1 && emptyStyles.swatchLast,
                    ]}
                  />
                ))}
              </View>
              <View style={emptyStyles.styleInfo}>
                <Text style={emptyStyles.styleEmoji}>{s.emoji}</Text>
                <Text style={emptyStyles.styleName}>{s.name}</Text>
                <Text style={emptyStyles.styleDesc}>{s.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const emptyStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 24,
  },
  illustrationCard: {
    backgroundColor: Colors.primaryLighter,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.1)",
  },
  illustrationEmojis: {
    fontSize: 36,
    letterSpacing: 4,
    marginBottom: 4,
  },
  illustrationTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  illustrationSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 50,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  stylesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  styleCard: {
    width: "47%",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  styleSwatchRow: {
    flexDirection: "row",
    height: 44,
  },
  swatch: {
    flex: 1,
  },
  swatchFirst: {
    borderTopLeftRadius: 16,
  },
  swatchLast: {
    borderTopRightRadius: 16,
  },
  styleInfo: {
    padding: 10,
    gap: 2,
  },
  styleEmoji: {
    fontSize: 18,
  },
  styleName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    marginTop: 2,
  },
  styleDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
  },
});

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { data: posts, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["posts"],
    queryFn: () => listPosts(),
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => likePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });

  const handleLike = useCallback((id: string) => likeMutation.mutate(id), [likeMutation]);

  const filteredPosts = (posts ?? [])
    .filter((p) => filter === "all" || p.petType.toLowerCase() === filter)
    .sort((a, b) =>
      sort === "popular"
        ? b.likes - a.likes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const isEmpty = !isLoading && !isError && posts?.length === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Community</Text>
          {posts && posts.length > 0 && (
            <Text style={styles.headerSub}>{posts.length} portrait{posts.length !== 1 ? "s" : ""} shared</Text>
          )}
        </View>
        <View style={styles.sortToggle}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => setSort(opt.id)}
              style={[styles.sortBtn, sort === opt.id && styles.sortBtnActive]}
            >
              <Feather name={opt.icon} size={12} color={sort === opt.id ? Colors.primary : Colors.textTertiary} />
              <Text style={[styles.sortText, sort === opt.id && styles.sortTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Pet filters — hide when empty */}
      {!isEmpty && (
        <View style={styles.filtersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
            {PET_FILTERS.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
              >
                <Text style={styles.filterEmoji}>{f.emoji}</Text>
                <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonHeaderText}>
                  <View style={[styles.skeletonLine, { width: 120 }]} />
                  <View style={[styles.skeletonLine, { width: 80, marginTop: 6, opacity: 0.5 }]} />
                </View>
              </View>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonFooter}>
                <View style={[styles.skeletonLine, { width: 60 }]} />
                <View style={[styles.skeletonLine, { width: 180, marginTop: 8 }]} />
              </View>
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Failed to load posts</Text>
        </View>
      ) : isEmpty ? (
        <CommunityEmptyState />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          extraData={filter + sort}
          renderItem={({ item }) => (
            <PostCard
              {...item}
              userAvatar={item.userAvatar ?? undefined}
              onLike={handleLike}
              onPress={() => router.push(`/post/${item.id}`)}
              onCommentPress={() => router.push(`/post/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.filterEmpty}>
              <Text style={styles.filterEmptyText}>
                No {filter === "all" ? "posts" : filter + "s"} found
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  sortToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 22,
    padding: 3,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  sortBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sortText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  sortTextActive: {
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  filtersBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    paddingBottom: 110,
  },
  filterEmpty: {
    paddingTop: 60,
    alignItems: "center",
  },
  filterEmptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textTertiary,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  skeletonList: {
    flex: 1,
    gap: 0,
  },
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
    marginBottom: 10,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
  },
  skeletonHeaderText: {
    flex: 1,
  },
  skeletonImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  skeletonFooter: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surfaceSecondary,
  },
});
