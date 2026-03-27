import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

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

interface PostCardProps {
  id: string;
  userName: string;
  userAvatar?: string;
  petName: string;
  petType: string;
  imageData: string;
  style: string;
  caption: string;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
  onLike: (id: string) => void;
  onPress?: () => void;
}

export function PostCard({
  id,
  userName,
  userAvatar,
  petName,
  petType,
  imageData,
  style: artStyle,
  caption,
  likes,
  likedByMe,
  createdAt,
  onLike,
  onPress,
}: PostCardProps) {
  const heartScale = useSharedValue(1);
  const heartFloatY = useSharedValue(0);
  const heartFloatOpacity = useSharedValue(0);
  const heartFloatScale = useSharedValue(0.3);
  const [localLiked, setLocalLiked] = useState(likedByMe);
  const [localLikes, setLocalLikes] = useState(likes);
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const floatHeartStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: heartFloatY.value }, { scale: heartFloatScale.value }],
    opacity: heartFloatOpacity.value,
  }));

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    heartScale.value = withSequence(
      withSpring(1.45, { damping: 7 }),
      withSpring(1, { damping: 9 })
    );
    setLocalLiked(!localLiked);
    setLocalLikes((prev) => (localLiked ? prev - 1 : prev + 1));
    onLike(id);
  };

  const triggerFloatHeart = () => {
    heartFloatY.value = 0;
    heartFloatScale.value = 0.3;
    heartFloatOpacity.value = 1;
    heartFloatY.value = withTiming(-80, { duration: 900 });
    heartFloatScale.value = withSpring(1.2, { damping: 6 });
    heartFloatOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(500, withTiming(0, { duration: 400 }))
    );
  };

  const handleImagePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      if (!localLiked) {
        handleLike();
      }
      triggerFloatHeart();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      tapTimerRef.current = setTimeout(() => {
        onPress?.();
        tapTimerRef.current = null;
      }, 260);
    }
    lastTapRef.current = now;
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const isRecent = Date.now() - new Date(createdAt).getTime() < 60 * 60 * 1000;
  const styleEmoji = getStyleEmoji(artStyle);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable onPress={onPress} style={styles.header}>
        <View style={styles.avatarWrap}>
          {userAvatar ? (
            <Image
              source={{ uri: `data:image/png;base64,${userAvatar}` }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={[styles.avatarImg, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {isRecent && <View style={styles.avatarDot} />}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.petTagRow}>
            <View style={styles.petTag}>
              <Text style={styles.petTagText}>{petName}</Text>
            </View>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.petType}>{petType}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.time}>{formatTime(createdAt)}</Text>
          <View style={styles.moreBtn}>
            <Feather name="more-horizontal" size={16} color={Colors.textTertiary} />
          </View>
        </View>
      </Pressable>

      {/* Image — single tap navigates, double tap likes */}
      <Pressable onPress={handleImagePress}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `data:image/png;base64,${imageData}` }}
            style={styles.postImage}
            resizeMode="cover"
          />
          {/* Bottom gradient overlay */}
          <View style={styles.imageGradient} />
          {/* Style badge */}
          <View style={styles.styleBadge}>
            <Text style={styles.styleBadgeEmoji}>{styleEmoji}</Text>
            <Text style={styles.styleText}>{artStyle}</Text>
          </View>
          {/* Floating heart on double-tap */}
          <Animated.Text style={[styles.floatHeart, floatHeartStyle]}>❤️</Animated.Text>
        </View>
      </Pressable>

      {/* Actions row */}
      <View style={styles.footer}>
        <View style={styles.actionsRow}>
          {/* Like */}
          <Pressable onPress={handleLike} style={styles.likeBtn} testID={`like-btn-${id}`}>
            <Animated.View style={heartStyle}>
              <Ionicons
                name={localLiked ? "heart" : "heart-outline"}
                size={26}
                color={localLiked ? Colors.like : Colors.textSecondary}
              />
            </Animated.View>
            {localLikes > 0 && (
              <Text style={[styles.likeCount, localLiked && { color: Colors.like }]}>
                {localLikes}
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.actionBtn}>
            <Feather name="message-circle" size={24} color={Colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.actionBtn}>
            <Feather name="send" size={22} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.spacer} />

          <Pressable style={styles.actionBtn}>
            <Feather name="bookmark" size={23} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {caption ? (
          <Text style={styles.caption}>
            <Text style={styles.captionUser}>{userName} </Text>
            <Text style={styles.captionText}>{caption}</Text>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    marginBottom: 10,
    borderRadius: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primaryLighter,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    color: Colors.textInverse,
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  avatarDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.text,
    letterSpacing: -0.1,
  },
  petTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  petTag: {
    backgroundColor: Colors.primaryLighter,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  petTagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.primary,
  },
  separator: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  petType: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
  },
  moreBtn: {
    padding: 2,
  },
  imageContainer: {
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: width,
    backgroundColor: Colors.surfaceSecondary,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: "transparent",
    backgroundImage: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.22))",
  },
  styleBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.52)",
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
  footer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingRight: 6,
    paddingVertical: 4,
  },
  likeCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  actionBtn: {
    padding: 6,
  },
  spacer: {
    flex: 1,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  captionUser: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  captionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  floatHeart: {
    position: "absolute",
    fontSize: 52,
    alignSelf: "center",
    bottom: "35%",
    pointerEvents: "none",
  },
});
