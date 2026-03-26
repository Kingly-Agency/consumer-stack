import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";
import { StyleCard, ART_STYLES, ArtStyle } from "@/components/StyleCard";
import { generateOpenaiImage, createPost } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Other"];

const { width } = Dimensions.get("window");

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { userName } = useApp();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState<"upload" | "style" | "preview" | "share">("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(null);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("Dog");
  const [caption, setCaption] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setOriginalImage(result.assets[0].base64);
      setStep("style");
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setOriginalImage(result.assets[0].base64);
      setStep("style");
    }
  };

  const generateImage = async () => {
    if (!selectedStyle && !customPrompt) {
      Alert.alert("Select a style", "Please select an art style or enter a custom prompt.");
      return;
    }
    if (!petName.trim()) {
      Alert.alert("Pet name required", "Please enter your pet's name.");
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const stylePrompt = selectedStyle?.prompt ?? "";
      const prompt = `A ${petType.toLowerCase()} named ${petName}, ${stylePrompt}${customPrompt ? `. ${customPrompt}` : ""}. High quality, professional photography composition, adorable pet portrait.`;

      const result = await generateOpenaiImage({
        prompt,
        size: "1024x1024",
      });

      setGeneratedImage(result.b64_json);
      setStep("preview");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Generation failed", "Could not generate image. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const postMutation = useMutation({
    mutationFn: () =>
      createPost({
        petName,
        petType,
        imageData: generatedImage!,
        style: selectedStyle?.name ?? "Custom",
        caption,
        userName,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      Alert.alert("Shared!", "Your pet portrait has been shared with the community.");
    },
  });

  const resetForm = () => {
    setStep("upload");
    setOriginalImage(null);
    setGeneratedImage(null);
    setSelectedStyle(null);
    setPetName("");
    setPetType("Dog");
    setCaption("");
    setCustomPrompt("");
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPadding + 12, paddingBottom: insets.bottom + 100 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create</Text>
        {step !== "upload" && (
          <Pressable onPress={resetForm}>
            <Text style={styles.resetText}>Start over</Text>
          </Pressable>
        )}
      </View>

      {/* Step indicators */}
      <View style={styles.steps}>
        {["upload", "style", "preview", "share"].map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, (["upload", "style", "preview", "share"].indexOf(step) >= i) && styles.stepDotActive]}>
              <Text style={[styles.stepNum, (["upload", "style", "preview", "share"].indexOf(step) >= i) && styles.stepNumActive]}>{i + 1}</Text>
            </View>
            {i < 3 && <View style={[styles.stepLine, (["upload", "style", "preview", "share"].indexOf(step) > i) && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      {/* STEP 1: Upload */}
      {step === "upload" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Your Pet Photo</Text>
          <Text style={styles.sectionSubtitle}>Choose a clear photo for the best AI results</Text>

          <View style={styles.uploadOptions}>
            <Pressable onPress={pickImage} style={styles.uploadBtn} testID="pick-image">
              <View style={styles.uploadIconBg}>
                <Feather name="image" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.uploadBtnTitle}>Gallery</Text>
              <Text style={styles.uploadBtnSub}>From your photos</Text>
            </Pressable>

            <Pressable onPress={takePhoto} style={styles.uploadBtn} testID="take-photo">
              <View style={styles.uploadIconBg}>
                <Feather name="camera" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.uploadBtnTitle}>Camera</Text>
              <Text style={styles.uploadBtnSub}>Take a new photo</Text>
            </Pressable>
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for best results:</Text>
            <Text style={styles.tipItem}>Good lighting, facing forward</Text>
            <Text style={styles.tipItem}>Clear focus on your pet's face</Text>
            <Text style={styles.tipItem}>Square crop works best</Text>
          </View>
        </View>
      )}

      {/* STEP 2: Style */}
      {step === "style" && (
        <View style={styles.section}>
          {originalImage && (
            <View style={styles.previewRow}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${originalImage}` }}
                style={styles.thumbnailImage}
              />
              <View style={styles.previewInfo}>
                <Text style={styles.previewLabel}>Original photo</Text>
                <Text style={styles.previewSub}>Tap a style to transform it</Text>
              </View>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Pet name *"
            placeholderTextColor={Colors.textTertiary}
            value={petName}
            onChangeText={setPetName}
            testID="pet-name-input"
          />

          <Text style={styles.label}>Pet type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petTypes}>
            {PET_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => setPetType(type)}
                style={[styles.typeBtn, petType === type && styles.typeBtnActive]}
              >
                <Text style={[styles.typeText, petType === type && styles.typeTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Art style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stylesScroll}>
            <View style={styles.stylesRow}>
              {ART_STYLES.map((s) => (
                <StyleCard
                  key={s.id}
                  style={s}
                  selected={selectedStyle?.id === s.id}
                  onSelect={setSelectedStyle}
                />
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Custom prompt (optional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Add extra details like 'with a bow tie' or 'in a garden'..."
            placeholderTextColor={Colors.textTertiary}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            multiline
            numberOfLines={3}
          />

          <Pressable
            onPress={generateImage}
            disabled={isGenerating || !petName.trim() || (!selectedStyle && !customPrompt)}
            style={[
              styles.generateBtn,
              (isGenerating || !petName.trim() || (!selectedStyle && !customPrompt)) && styles.generateBtnDisabled,
            ]}
            testID="generate-btn"
          >
            {isGenerating ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Feather name="zap" size={18} color={Colors.textInverse} />
                <Text style={styles.generateBtnText}>Generate AI Art</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* STEP 3: Preview */}
      {step === "preview" && generatedImage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your AI Portrait</Text>
          <Image
            source={{ uri: `data:image/png;base64,${generatedImage}` }}
            style={styles.generatedImage}
            resizeMode="cover"
          />
          <View style={styles.previewActions}>
            <Pressable onPress={() => setStep("style")} style={styles.secondaryBtn}>
              <Feather name="refresh-cw" size={16} color={Colors.primary} />
              <Text style={styles.secondaryBtnText}>Regenerate</Text>
            </Pressable>
            <Pressable onPress={() => setStep("share")} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Share it</Text>
              <Feather name="arrow-right" size={16} color={Colors.textInverse} />
            </Pressable>
          </View>
        </View>
      )}

      {/* STEP 4: Share */}
      {step === "share" && generatedImage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share with Community</Text>
          <Image
            source={{ uri: `data:image/png;base64,${generatedImage}` }}
            style={styles.sharePreview}
            resizeMode="cover"
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Write a caption..."
            placeholderTextColor={Colors.textTertiary}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />
          <View style={styles.shareActions}>
            <Pressable
              onPress={() => postMutation.mutate()}
              disabled={postMutation.isPending}
              style={styles.primaryBtn}
              testID="share-btn"
            >
              {postMutation.isPending ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <>
                  <Feather name="share-2" size={16} color={Colors.textInverse} />
                  <Text style={styles.primaryBtnText}>Share to Community</Text>
                </>
              )}
            </Pressable>
          </View>
          <Pressable style={styles.skipShare}>
            <Text style={styles.skipShareText}>Keep private (don't share)</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.text,
  },
  resetText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.primary,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  stepNumActive: {
    color: Colors.textInverse,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  uploadOptions: {
    flexDirection: "row",
    gap: 16,
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  uploadIconBg: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadBtnTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  uploadBtnSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tips: {
    backgroundColor: Colors.accentLight,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  tipsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  tipItem: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    paddingLeft: 8,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
  },
  thumbnailImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  previewInfo: {
    gap: 4,
  },
  previewLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  previewSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  petTypes: {
    marginTop: -8,
  },
  typeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    marginRight: 8,
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
  },
  typeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.textInverse,
  },
  stylesScroll: {
    marginTop: -8,
  },
  stylesRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textInverse,
  },
  generatedImage: {
    width: "100%",
    height: width - 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.primary,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  primaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textInverse,
  },
  sharePreview: {
    width: "100%",
    height: (width - 40) * 0.65,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },
  shareActions: {
    gap: 12,
  },
  skipShare: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipShareText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
