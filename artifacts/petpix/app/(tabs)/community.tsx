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
  { id: "all", label: "All", icon: "globe" as const },
  { id: "dog", label: "Dogs", icon: "disc" as const },
  { id: "cat", label: "Cats", icon: "circle" as const },
  { id: "bird", label: "Birds", icon: "feather" as const },
  { id: "rabbit", label: "Rabbits", icon: "activity" as const },
  { id: "other", label: "Other", icon: "more-horizontal" as const },
];

const SORT_OPTIONS = [
  { id: "recent", label: "Recent" },
  { id: "popular", label: "Popular" },
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

  const handleLike = useCallback((id: string) => {
    likeMutation.mutate(id);
  }, [likeMutation]);

  const filteredPosts = (posts ?? [])
    .filter((p) => filter === "all" || p.petType.toLowerCase() === filter)
    .sort((a, b) =>
      sort === "popular"
        ? b.likes - a.likes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => setSort(opt.id)}
              style={[styles.sortBtn, sort === opt.id && styles.sortBtnActive]}
            >
              <Text style={[styles.sortText, sort === opt.id && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {PET_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
            >
              <Feather
                name={f.icon}
                size={14}
                color={filter === f.id ? Colors.textInverse : Colors.textSecondary}
              />
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
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
          scrollEnabled={!!filteredPosts.length}
          renderItem={({ item }) => (
            <PostCard {...item} userAvatar={item.userAvatar ?? undefined} onLike={handleLike} />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="image" size={52} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No posts here</Text>
              <Text style={styles.emptyText}>Be the first to share a {filter === "all" ? "pet" : filter} portrait!</Text>
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
  sortRow: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 20,
    padding: 3,
  },
  sortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sortText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sortTextActive: {
    color: Colors.text,
  },
  filtersContainer: {
    backgroundColor: Colors.surface,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  filters: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
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
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
