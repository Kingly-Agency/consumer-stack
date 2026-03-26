import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
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
      withSpring(1.4, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    setLocalLiked(!localLiked);
    setLocalLikes((prev) => (localLiked ? prev - 1 : prev + 1));
    onLike(id);
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {userAvatar ? (
            <Image source={{ uri: `data:image/png;base64,${userAvatar}` }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.petInfo}>{petName} · {petType}</Text>
        </View>
        <Text style={styles.time}>{formatTime(createdAt)}</Text>
      </View>

      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: `data:image/png;base64,${imageData}` }}
          style={styles.postImage}
          resizeMode="cover"
        />
        <View style={styles.styleBadge}>
          <Text style={styles.styleText}>{artStyle}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.actions}>
          <Pressable onPress={handleLike} style={styles.actionBtn} testID={`like-btn-${id}`}>
            <Animated.View style={heartStyle}>
              <Feather
                name="heart"
                size={22}
                color={localLiked ? Colors.like : Colors.textSecondary}
                style={localLiked ? { opacity: 1 } : {}}
              />
            </Animated.View>
            <Text style={[styles.actionCount, localLiked && { color: Colors.like }]}>
              {localLikes}
            </Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Feather name="message-circle" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Feather name="share-2" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionUser}>{userName} </Text>
            {caption}
          </Text>
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
    paddingVertical: 12,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    color: Colors.textInverse,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  petInfo: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  imageWrapper: {
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: width,
    backgroundColor: Colors.surfaceSecondary,
  },
  styleBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  styleText: {
    color: "#fff",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  captionUser: {
    fontFamily: "Inter_600SemiBold",
  },
});
