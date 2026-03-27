import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
  Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPosts, likePost } from "@workspace/api-client-react";
import { Feather, Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useToast } from "@/components/Toast";

const { width } = Dimensions.get("window");

const STYLE_EMOJI: Record<string, string> = {
  cartoon: "🎨",
  watercolor: "💧",
  "oil paint": "🖼️",
  "oil painting": "🖼️",
  "pop art": "⚡",
  sketch: "✏️",
  "pixel art": "👾",
  anime: "⭐",
  "3d render": "📦",
};

function getStyleEmoji(style: string): string {
  return STYLE_EMOJI[style.toLowerCase()] ?? "✨";
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => listPosts(),
  });

  const post = posts?.find((p) => p.id === id);

  const morePosts = React.useMemo(() => {
    if (!posts || !post) return [];
    return posts.filter((p) => p.id !== id && p.petName?.toLowerCase() === post.petName?.toLowerCase()).slice(0, 6);
  }, [posts, post, id]);

  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localLikes, setLocalLikes] = useState<number | null>(null);
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const likeMutation = useMutation({
    mutationFn: () => likePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });

  const handleLike = () => {
    if (!post) return;
    const liked = localLiked !== null ? localLiked : post.likedByMe;
    const likes = localLikes !== null ? localLikes : post.likes;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    heartScale.value = withSequence(
      withSpring(1.45, { damping: 7 }),
      withSpring(1, { damping: 9 })
    );
    setLocalLiked(!liked);
    setLocalLikes(liked ? likes - 1 : likes + 1);
    likeMutation.mutate();
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `Check out this ${post.style} portrait of ${post.petName} on PetPix! 🐾✨`,
        title: `${post.petName}'s ${post.style} Portrait`,
      });
    } catch {
      toast.show("Couldn't share", { type: "error" });
    }
  };

  const handleTryStyle = () => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/create");
    toast.show(`Try ${post.style} style!`, {
      type: "info",
      subtitle: "Select this style to create your own portrait",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Feather name="image" size={40} color={Colors.textTertiary} />
        <Text style={styles.notFoundText}>Post not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn2}>
          <Text style={styles.backBtn2Text}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const likedNow = localLiked !== null ? localLiked : post.likedByMe;
  const likesNow = localLikes !== null ? localLikes : post.likes;
  const styleEmoji = getStyleEmoji(post.style);

  return (
    <View style={styles.container}>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: Platform.OS === "web" ? 16 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>{post.petName}'s Portrait</Text>
        <Pressable style={styles.shareNavBtn} onPress={handleShare}>
          <Feather name="share" size={18} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `data:image/png;base64,${post.imageData}` }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.styleBadge}>
            <Text style={styles.styleBadgeEmoji}>{styleEmoji}</Text>
            <Text style={styles.styleText}>{post.style}</Text>
          </View>

          {/* Try this style button */}
          <Pressable style={styles.tryStyleBtn} onPress={handleTryStyle}>
            <Feather name="zap" size={13} color={Colors.primary} />
            <Text style={styles.tryStyleText}>Try this style</Text>
          </Pressable>
        </View>

        {/* Post info */}
        <View style={styles.info}>
          {/* Author row */}
          <View style={styles.authorRow}>
            <View style={styles.avatarWrap}>
              {post.userAvatar ? (
                <Image
                  source={{ uri: `data:image/png;base64,${post.userAvatar}` }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarLetter}>{post.userName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.userName}</Text>
              <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
            </View>
          </View>

          {/* Pet + Style info card */}
          <View style={styles.petCard}>
            <View style={styles.petCardLeft}>
              <Text style={styles.petCardLabel}>Pet</Text>
              <Text style={styles.petCardName}>{post.petName}</Text>
              <View style={styles.petTypePill}>
                <Text style={styles.petTypePillText}>{post.petType}</Text>
              </View>
            </View>
            <View style={styles.petCardDivider} />
            <View style={styles.petCardRight}>
              <Text style={styles.petCardLabel}>Style</Text>
              <View style={styles.petCardStyleRow}>
                <Text style={styles.petCardStyleEmoji}>{styleEmoji}</Text>
                <Text style={styles.petCardStyle}>{post.style}</Text>
              </View>
            </View>
          </View>

          {/* Caption */}
          {post.caption ? (
            <View style={styles.captionBox}>
              <Text style={styles.captionLine}>
                <Text style={styles.captionUser}>{post.userName} </Text>
                <Text style={styles.captionText}>{post.caption}</Text>
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable onPress={handleLike} style={styles.likeBtn}>
              <Animated.View style={heartStyle}>
                <Ionicons
                  name={likedNow ? "heart" : "heart-outline"}
                  size={26}
                  color={likedNow ? Colors.like : Colors.textSecondary}
                />
              </Animated.View>
              <Text style={[styles.likeCount, likedNow && styles.likeCountActive]}>
                {likesNow} {likesNow === 1 ? "like" : "likes"}
              </Text>
            </Pressable>
            <View style={styles.actionsSpacer} />
            <Pressable
              style={styles.actionBtn}
              onPress={() => toast.show("Comments coming soon!", { type: "info", subtitle: "Stay tuned for this feature" })}
            >
              <Feather name="message-circle" size={22} color={Colors.textSecondary} />
              <Text style={styles.actionBtnText}>Comment</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleShare}>
              <Feather name="send" size={20} color={Colors.textSecondary} />
              <Text style={styles.actionBtnText}>Share</Text>
            </Pressable>
          </View>
        </View>

        {/* More portraits of this pet */}
        {morePosts.length > 0 && (
          <View style={styles.moreSection}>
            <Text style={styles.moreSectionTitle}>More portraits of {post.petName}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreScroll}>
              {morePosts.map((mp) => (
                <Pressable
                  key={mp.id}
                  style={styles.moreCard}
                  onPress={() => router.replace(`/post/${mp.id}`)}
                >
                  <Image
                    source={{ uri: `data:image/png;base64,${mp.imageData}` }}
                    style={styles.moreCardImage}
                  />
                  <View style={styles.moreCardBadge}>
                    <Text style={styles.moreCardBadgeText}>{getStyleEmoji(mp.style)} {mp.style}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  shareNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingBottom: 80,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width,
    height: width,
    backgroundColor: Colors.surfaceSecondary,
  },
  styleBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  styleBadgeEmoji: {
    fontSize: 12,
  },
  styleText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  tryStyleBtn: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  tryStyleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.primary,
  },
  info: {
    padding: 20,
    gap: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textInverse,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
  postDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  petCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
    alignItems: "center",
  },
  petCardLeft: {
    flex: 1,
    gap: 4,
  },
  petCardRight: {
    flex: 1,
    gap: 4,
  },
  petCardDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  petCardLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  petCardName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  petTypePill: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryLighter,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  petTypePillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.primary,
  },
  petCardStyleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  petCardStyleEmoji: {
    fontSize: 16,
  },
  petCardStyle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  captionBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  captionLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  captionUser: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  captionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 4,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  likeCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  likeCountActive: {
    color: Colors.like,
  },
  actionsSpacer: {
    flex: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  moreSection: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  moreSectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.2,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  moreScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  moreCard: {
    width: 130,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surfaceSecondary,
    position: "relative",
  },
  moreCardImage: {
    width: 130,
    height: 130,
  },
  moreCardBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  moreCardBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#fff",
  },
  notFoundText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  backBtn2: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primaryLighter,
  },
  backBtn2Text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
});
