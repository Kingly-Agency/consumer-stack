import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPosts, likePost } from "@workspace/api-client-react";
import { router } from "expo-router";
import { PostCard } from "@/components/PostCard";
import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";

function HomeEmptyState() {
  return (
    <View style={emptyStyles.container}>
      {/* Hero gradient card */}
      <View style={emptyStyles.heroCard}>
        <View style={emptyStyles.heroPawRow}>
          <Text style={emptyStyles.pawEmoji}>🐶</Text>
          <Text style={[emptyStyles.pawEmoji, emptyStyles.pawCenter]}>🐱</Text>
          <Text style={emptyStyles.pawEmoji}>🐰</Text>
        </View>
        <Text style={emptyStyles.heroTitle}>Your feed is waiting!</Text>
        <Text style={emptyStyles.heroSubtitle}>
          Create your first AI pet portrait and share it with the world.
        </Text>
        <Pressable
          style={emptyStyles.ctaBtn}
          onPress={() => router.push("/create")}
        >
          <Feather name="zap" size={16} color="#fff" />
          <Text style={emptyStyles.ctaBtnText}>Create a Portrait</Text>
        </Pressable>
      </View>

      {/* Feature pills */}
      <View style={emptyStyles.features}>
        {[
          { icon: "image", label: "8 Art Styles" },
          { icon: "users", label: "Community Feed" },
          { icon: "heart", label: "Like & Share" },
        ].map((f) => (
          <View key={f.label} style={emptyStyles.featurePill}>
            <Feather name={f.icon as any} size={13} color={Colors.primary} />
            <Text style={emptyStyles.featurePillText}>{f.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 20,
  },
  heroCard: {
    backgroundColor: Colors.primaryLighter,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.12)",
  },
  heroPawRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  pawEmoji: {
    fontSize: 38,
  },
  pawCenter: {
    fontSize: 46,
    marginHorizontal: 4,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    textAlign: "center",
  },
  heroSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
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
    elevation: 6,
  },
  ctaBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  features: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featurePillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

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

  const handleLike = useCallback(
    (id: string) => {
      likeMutation.mutate(id);
    },
    [likeMutation]
  );

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🐾</Text>
          </View>
          <Text style={styles.headerTitle}>PetPix</Text>
        </View>
        <Pressable style={styles.notifBtn}>
          <Feather name="bell" size={20} color={Colors.text} />
        </Pressable>
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
        ListEmptyComponent={<HomeEmptyState />}
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
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  logoEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
