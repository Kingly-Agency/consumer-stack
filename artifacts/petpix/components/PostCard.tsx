import React, { useState } from "react";
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
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

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
  const [localLiked, setLocalLiked] = useState(likedByMe);
  const [localLikes, setLocalLikes] = useState(likes);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
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

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
          {/* Online dot decoration */}
          <View style={styles.avatarDot} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.petTagRow}>
            <View style={styles.petTag}>
              <Text style={styles.petTagText}>{petName}</Text>
            </View>
            <Text style={styles.petType}>{petType}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.time}>{formatTime(createdAt)}</Text>
          <Pressable style={styles.moreBtn}>
            <Feather name="more-horizontal" size={18} color={Colors.textTertiary} />
          </Pressable>
        </View>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: `data:image/png;base64,${imageData}` }}
          style={styles.postImage}
          resizeMode="cover"
        />
        {/* Style badge */}
        <View style={styles.styleBadge}>
          <Feather name="zap" size={10} color="#fff" />
          <Text style={styles.styleText}>{artStyle}</Text>
        </View>
      </View>

      {/* Actions + caption */}
      <View style={styles.footer}>
        <View style={styles.actionsRow}>
          <Pressable onPress={handleLike} style={styles.likeBtn} testID={`like-btn-${id}`}>
            <Animated.View style={[heartStyle]}>
              <Ionicons
                name={localLiked ? "heart" : "heart-outline"}
                size={24}
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
            <Feather name="message-circle" size={22} color={Colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.actionBtn}>
            <Feather name="send" size={20} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.spacer} />

          <Pressable style={styles.actionBtn}>
            <Feather name="bookmark" size={21} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {caption ? (
          <View style={styles.captionRow}>
            <Text style={styles.captionUser}>{userName} </Text>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    color: Colors.textInverse,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  avatarDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  petTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  petType: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 2,
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
    gap: 4,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingRight: 8,
  },
  likeCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionBtn: {
    padding: 4,
  },
  spacer: {
    flex: 1,
  },
  captionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    lineHeight: 20,
    flex: 1,
    flexShrink: 1,
  },
});
