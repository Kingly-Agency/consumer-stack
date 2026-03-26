import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPosts, likePost } from "@workspace/api-client-react";
import { PostCard } from "@/components/PostCard";
import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: posts, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["posts"],
    queryFn: () => listPosts(),
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => likePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleLike = useCallback((id: string) => {
    likeMutation.mutate(id);
  }, [likeMutation]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: topPadding }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { paddingTop: topPadding }]}>
        <Feather name="wifi-off" size={40} color={Colors.textTertiary} />
        <Text style={styles.errorText}>Failed to load posts</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={styles.headerTitle}>PetPix</Text>
        <Feather name="bell" size={22} color={Colors.text} />
      </View>

      <FlatList
        data={posts ?? []}
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
            <Feather name="image" size={52} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Create your first AI pet portrait and share it with the community!
            </Text>
          </View>
        }
        contentContainerStyle={
          posts && posts.length === 0 ? styles.emptyContainer : undefined
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
    backgroundColor: Colors.background,
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
    color: Colors.primary,
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
    textAlign: "center",
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
    marginTop: 12,
  },
});
