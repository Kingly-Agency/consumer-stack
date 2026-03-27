import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@workspace/api-client-react";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const topPadding = Platform.OS === "web" ? 0 : insets.top;

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
      updateProfile({ username, displayName, bio, avatarData: avatarData ?? undefined }),
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

  const canSave = displayName.trim().length > 0 && username.trim().length > 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <Feather name="x" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <Pressable
          onPress={() => updateMutation.mutate()}
          disabled={!canSave || updateMutation.isPending}
          style={[styles.saveBtn, (!canSave || updateMutation.isPending) && styles.saveBtnDisabled]}
          testID="save-profile-btn"
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrapper}>
            {avatarData ? (
              <Image source={{ uri: `data:image/jpeg;base64,${avatarData}` }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>
                  {(displayName || "P").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Feather name="camera" size={14} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.changePhotoLabel}>Change photo</Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <InputField
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your full name"
            icon="user"
          />
          <InputField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            autoCapitalize="none"
            icon="at-sign"
            prefix="@"
          />
          <InputField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the community about you and your pets…"
            multiline
            icon="align-left"
          />
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable style={styles.dangerItem}>
            <Feather name="log-out" size={16} color={Colors.error} />
            <Text style={styles.dangerText}>Sign out</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

function InputField({
  label,
  icon,
  prefix,
  multiline,
  ...props
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  prefix?: string;
  multiline?: boolean;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.inputRow, multiline && fieldStyles.inputRowMulti]}>
        <Feather name={icon} size={15} color={Colors.textTertiary} style={fieldStyles.icon} />
        {prefix && <Text style={fieldStyles.prefix}>{prefix}</Text>}
        <TextInput
          style={[fieldStyles.input, multiline && fieldStyles.inputMulti]}
          placeholderTextColor={Colors.textTertiary}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? "top" : "center"}
          {...props}
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    gap: 8,
    minHeight: 52,
  },
  inputRowMulti: {
    alignItems: "flex-start",
    paddingTop: 14,
    minHeight: 100,
  },
  icon: {
    marginTop: 1,
  },
  prefix: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textTertiary,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  inputMulti: {
    paddingBottom: 14,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 60,
    gap: 28,
  },
  avatarSection: {
    alignItems: "center",
    gap: 8,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    color: Colors.textInverse,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: Colors.background,
  },
  changePhotoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.primary,
  },
  fields: {
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  dangerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(244,67,54,0.15)",
  },
  dangerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.error,
  },
});
