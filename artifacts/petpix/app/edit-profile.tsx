import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@workspace/api-client-react";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { TextInput } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarData, setAvatarData] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setDisplayName(profile.displayName);
      setBio(profile.bio ?? "");
      setAvatarData(profile.avatarData ?? null);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        username,
        displayName,
        bio,
        avatarData: avatarData ?? undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
  });

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setAvatarData(result.assets[0].base64);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <Pressable
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          testID="save-profile-btn"
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Pressable onPress={pickAvatar} style={styles.avatarSection}>
          {avatarData ? (
            <Image source={{ uri: `data:image/jpeg;base64,${avatarData}` }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {displayName.charAt(0).toUpperCase() || "P"}
              </Text>
            </View>
          )}
          <View style={styles.avatarOverlay}>
            <Feather name="camera" size={16} color={Colors.textInverse} />
          </View>
          <Text style={styles.changePhotoText}>Change photo</Text>
        </Pressable>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="@username"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the community about you and your pets..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  navTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.text,
  },
  saveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 28,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    position: "relative",
    gap: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: Colors.textInverse,
  },
  avatarOverlay: {
    position: "absolute",
    top: 32 + 70,
    right: "50%",
    transform: [{ translateX: 26 }],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  changePhotoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.primary,
  },
  fields: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
});
