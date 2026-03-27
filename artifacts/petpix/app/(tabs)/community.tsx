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
import { PostCard } from "@/components/PostCard";
import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";

const PET_FILTERS = [
  { id: "all", label: "All pets", icon: "globe" as const },
  { id: "dog", label: "Dogs", icon: "disc" as const },
  { id: "cat", label: "Cats", icon: "circle" as const },
  { id: "bird", label: "Birds", icon: "feather" as const },
  { id: "rabbit", label: "Rabbits", icon: "activity" as const },
  { id: "other", label: "Other", icon: "more-horizontal" as const },
];

const SORT_OPTIONS = [
  { id: "recent", label: "Recent", icon: "clock" as const },
  { id: "popular", label: "Popular", icon: "trending-up" as const },
];

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

  const handleLike = useCallback(
    (id: string) => { likeMutation.mutate(id); },
    [likeMutation]
  );

  const filteredPosts = (posts ?? [])
    .filter((p) => filter === "all" || p.petType.toLowerCase() === filter)
    .sort((a, b) =>
      sort === "popular"
        ? b.likes - a.likes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Community</Text>
          <Text style={styles.headerSub}>
            {posts ? `${posts.length} portrait${posts.length !== 1 ? "s" : ""}` : "Discover AI pet art"}
          </Text>
        </View>
        {/* Sort toggle */}
        <View style={styles.sortToggle}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => setSort(opt.id)}
              style={[styles.sortBtn, sort === opt.id && styles.sortBtnActive]}
            >
              <Feather
                name={opt.icon}
                size={13}
                color={sort === opt.id ? Colors.primary : Colors.textTertiary}
              />
              <Text style={[styles.sortText, sort === opt.id && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Pet type filters */}
      <View style={styles.filtersBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {PET_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            >
              <Feather
                name={f.icon}
                size={13}
                color={filter === f.id ? Colors.textInverse : Colors.textSecondary}
              />
              <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Failed to load posts</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              {...item}
              userAvatar={item.userAvatar ?? undefined}
              onLike={handleLike}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBg}>
                <Feather name="image" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share a {filter === "all" ? "pet" : filter} portrait!
              </Text>
            </View>
          }
          contentContainerStyle={filteredPosts.length === 0 ? styles.emptyContainer : undefined}
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
    gap: 2,
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
  filterChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  empty: {
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyIconBg: {
    width: 68,
    height: 68,
    borderRadius: 22,
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
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
