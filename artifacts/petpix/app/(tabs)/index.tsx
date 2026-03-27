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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPosts, likePost } from "@workspace/api-client-react";
import { router } from "expo-router";
import { PostCard } from "@/components/PostCard";
import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import { ART_STYLES } from "@/components/StyleCard";

const HOW_IT_WORKS = [
  { step: "1", icon: "upload", label: "Upload", desc: "A photo of your pet" },
  { step: "2", icon: "zap", label: "Style", desc: "Pick an AI art style" },
  { step: "3", icon: "share-2", label: "Share", desc: "Post to the community" },
];

function HomeEmptyState() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={emptyStyles.scrollContent}
    >
      {/* Hero */}
      <View style={emptyStyles.heroCard}>
        <Text style={emptyStyles.heroEmojis}>🐶 🐱 🐰</Text>
        <Text style={emptyStyles.heroTitle}>Turn your pet into AI art</Text>
        <Text style={emptyStyles.heroSubtitle}>
          Upload a photo, pick a style, and get a stunning portrait in seconds.
        </Text>
        <Pressable style={emptyStyles.ctaBtn} onPress={() => router.push("/create")}>
          <Feather name="zap" size={16} color="#fff" />
          <Text style={emptyStyles.ctaBtnText}>Create Your First Portrait</Text>
        </Pressable>
      </View>

      {/* How it works */}
      <View style={emptyStyles.section}>
        <Text style={emptyStyles.sectionTitle}>How it works</Text>
        <View style={emptyStyles.howRow}>
          {HOW_IT_WORKS.map((item, i) => (
            <View key={item.step} style={emptyStyles.howCard}>
              <View style={emptyStyles.howIconBg}>
                <Feather name={item.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={emptyStyles.howLabel}>{item.label}</Text>
              <Text style={emptyStyles.howDesc}>{item.desc}</Text>
              {i < HOW_IT_WORKS.length - 1 && (
                <View style={emptyStyles.howArrow}>
                  <Feather name="chevron-right" size={16} color={Colors.border} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Style showcase */}
      <View style={emptyStyles.section}>
        <Text style={emptyStyles.sectionTitle}>8 beautiful styles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={emptyStyles.stylesScroll}>
          <View style={emptyStyles.stylesRow}>
            {ART_STYLES.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => router.push("/create")}
                style={emptyStyles.styleChip}
              >
                <View style={emptyStyles.styleSwatchRow}>
                  {s.colors.map((c, i) => (
                    <View
                      key={c}
                      style={[
                        emptyStyles.styleSwatch,
                        { backgroundColor: c },
                        i === 0 && emptyStyles.swatchFirst,
                        i === s.colors.length - 1 && emptyStyles.swatchLast,
                      ]}
                    />
                  ))}
                </View>
                <Text style={emptyStyles.styleChipEmoji}>{s.emoji}</Text>
                <Text style={emptyStyles.styleChipName}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Feature pills */}
      <View style={emptyStyles.featureRow}>
        {[
          { icon: "users", label: "Community feed" },
          { icon: "heart", label: "Like & share" },
          { icon: "bookmark", label: "Save favorites" },
        ].map((f) => (
          <View key={f.label} style={emptyStyles.featurePill}>
            <Feather name={f.icon as any} size={12} color={Colors.primary} />
            <Text style={emptyStyles.featurePillText}>{f.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const emptyStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 24,
  },
  heroCard: {
    backgroundColor: Colors.primaryLighter,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.1)",
  },
  heroEmojis: {
    fontSize: 36,
    letterSpacing: 4,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
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
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 50,
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
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
  howRow: {
    flexDirection: "row",
    gap: 0,
  },
  howCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    gap: 6,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginHorizontal: 4,
  },
  howIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  howLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  howDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 15,
  },
  howArrow: {
    position: "absolute",
    right: -14,
    top: "50%",
    zIndex: 2,
  },
  stylesScroll: {
    marginHorizontal: -20,
  },
  stylesRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  styleChip: {
    width: 80,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    alignItems: "center",
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  styleSwatchRow: {
    flexDirection: "row",
    width: "100%",
    height: 30,
  },
  styleSwatch: {
    flex: 1,
    height: "100%",
  },
  swatchFirst: {
    borderTopLeftRadius: 14,
  },
  swatchLast: {
    borderTopRightRadius: 14,
  },
  styleChipEmoji: {
    fontSize: 16,
    marginTop: 6,
  },
  styleChipName: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.text,
    marginTop: 2,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featurePillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });

  const handleLike = useCallback((id: string) => likeMutation.mutate(id), [likeMutation]);

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
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🐾</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>PetPix</Text>
            <Text style={styles.headerSub}>{greeting} 👋</Text>
          </View>
        </View>
        <Pressable style={styles.notifBtn}>
          <Feather name="bell" size={20} color={Colors.text} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      {posts && posts.length === 0 ? (
        <HomeEmptyState />
      ) : (
        <FlatList
          data={posts ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              {...item}
              userAvatar={item.userAvatar ?? undefined}
              onLike={handleLike}
              onPress={() => router.push(`/post/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
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
    lineHeight: 26,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 14,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.surfaceSecondary,
  },
  listContent: {
    paddingBottom: 110,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primaryLighter,
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
});
