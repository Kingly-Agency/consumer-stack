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

const STEPS = ["Photo", "Style", "Preview", "Share"];

type Step = "upload" | "style" | "preview" | "share";
const STEP_LIST: Step[] = ["upload", "style", "preview", "share"];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { userName } = useApp();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState<Step>("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(null);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("Dog");
  const [caption, setCaption] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const stepIndex = STEP_LIST.indexOf(step);

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
      Alert.alert("Select a style", "Please pick an art style or enter a custom prompt.");
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
      const prompt = `A ${petType.toLowerCase()} named ${petName}, ${stylePrompt}${customPrompt ? `. ${customPrompt}` : ""}. High quality, professional composition, adorable pet portrait.`;
      const result = await generateOpenaiImage({ prompt, size: "1024x1024" });
      setGeneratedImage(result.b64_json);
      setStep("preview");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Generation failed", "Could not generate the image. Please try again.");
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
      Alert.alert("Posted!", "Your pet portrait is live on the community feed.");
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

  const canGenerate = petName.trim() && (!!selectedStyle || customPrompt.trim());

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding + 16, paddingBottom: insets.bottom + 110 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create</Text>
        {step !== "upload" && (
          <Pressable onPress={resetForm} style={styles.resetBtn}>
            <Feather name="x" size={16} color={Colors.textSecondary} />
            <Text style={styles.resetText}>Start over</Text>
          </Pressable>
        )}
      </View>

      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, i <= stepIndex && styles.stepCircleActive]}>
                {i < stepIndex ? (
                  <Feather name="check" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, i <= stepIndex && styles.stepNumActive]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i <= stepIndex && styles.stepLabelActive]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepConnector, i < stepIndex && styles.stepConnectorActive]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* STEP 1: Upload */}
      {step === "upload" && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Upload Your Pet Photo</Text>
            <Text style={styles.sectionSub}>Choose a clear, well-lit photo for best AI results</Text>
          </View>

          <View style={styles.uploadGrid}>
            <Pressable onPress={pickImage} style={styles.uploadCard} testID="pick-image">
              <View style={styles.uploadIconRing}>
                <Feather name="image" size={30} color={Colors.primary} />
              </View>
              <Text style={styles.uploadTitle}>Gallery</Text>
              <Text style={styles.uploadSub}>From your photos</Text>
            </Pressable>

            <Pressable onPress={takePhoto} style={styles.uploadCard} testID="take-photo">
              <View style={styles.uploadIconRing}>
                <Feather name="camera" size={30} color={Colors.primary} />
              </View>
              <Text style={styles.uploadTitle}>Camera</Text>
              <Text style={styles.uploadSub}>Take a new photo</Text>
            </Pressable>
          </View>

          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Feather name="info" size={14} color={Colors.primary} />
              <Text style={styles.tipsTitle}>Tips for best results</Text>
            </View>
            {[
              "Good lighting, pet facing forward",
              "Clear focus on your pet's face",
              "Square crop works best",
            ].map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* STEP 2: Style */}
      {step === "style" && (
        <View style={styles.section}>
          {originalImage && (
            <View style={styles.photoPreviewCard}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${originalImage}` }}
                style={styles.thumbImage}
              />
              <View style={styles.photoPreviewInfo}>
                <Text style={styles.photoPreviewTitle}>Your photo</Text>
                <Text style={styles.photoPreviewSub}>Ready to transform</Text>
                <Pressable onPress={pickImage} style={styles.changePhotoBtn}>
                  <Feather name="refresh-cw" size={12} color={Colors.primary} />
                  <Text style={styles.changePhotoText}>Change</Text>
                </Pressable>
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

          <View>
            <Text style={styles.fieldLabel}>Pet type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {PET_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setPetType(type)}
                    style={[styles.chip, petType === type && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, petType === type && styles.chipTextActive]}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View>
            <Text style={styles.fieldLabel}>Art style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          </View>

          <View>
            <Text style={styles.fieldLabel}>Extra details (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder='e.g. "with a bow tie", "in a garden", "at sunset"'
              placeholderTextColor={Colors.textTertiary}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              multiline
              numberOfLines={3}
            />
          </View>

          <Pressable
            onPress={generateImage}
            disabled={isGenerating || !canGenerate}
            style={[styles.primaryBtn, (!canGenerate || isGenerating) && styles.primaryBtnDisabled]}
            testID="generate-btn"
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.primaryBtnText}>Generating magic...</Text>
              </>
            ) : (
              <>
                <Feather name="zap" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Generate AI Portrait</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* STEP 3: Preview */}
      {step === "preview" && generatedImage && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your AI Portrait ✨</Text>
            <Text style={styles.sectionSub}>
              {selectedStyle?.name ?? "Custom"} style · {petName}
            </Text>
          </View>

          <View style={styles.generatedImageContainer}>
            <Image
              source={{ uri: `data:image/png;base64,${generatedImage}` }}
              style={styles.generatedImage}
              resizeMode="cover"
            />
            {selectedStyle && (
              <View style={styles.styleBadge}>
                <Text style={styles.styleBadgeText}>{selectedStyle.name}</Text>
              </View>
            )}
          </View>

          <View style={styles.previewActions}>
            <Pressable onPress={() => setStep("style")} style={styles.outlineBtn}>
              <Feather name="refresh-cw" size={15} color={Colors.primary} />
              <Text style={styles.outlineBtnText}>Try again</Text>
            </Pressable>
            <Pressable onPress={() => setStep("share")} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Share to community</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* STEP 4: Share */}
      {step === "share" && generatedImage && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Share it</Text>
            <Text style={styles.sectionSub}>Add a caption and post to the community</Text>
          </View>

          <View style={styles.sharePreviewRow}>
            <Image
              source={{ uri: `data:image/png;base64,${generatedImage}` }}
              style={styles.shareThumb}
              resizeMode="cover"
            />
            <View style={styles.sharePreviewInfo}>
              <Text style={styles.sharePreviewName}>{petName}</Text>
              <Text style={styles.sharePreviewStyle}>{selectedStyle?.name ?? "Custom"} style</Text>
            </View>
          </View>

          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Write a caption… (optional)"
            placeholderTextColor={Colors.textTertiary}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
          />

          <Pressable
            onPress={() => postMutation.mutate()}
            disabled={postMutation.isPending}
            style={[styles.primaryBtn, postMutation.isPending && styles.primaryBtnDisabled]}
            testID="share-btn"
          >
            {postMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Post to Community</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={resetForm} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Discard and start over</Text>
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
    letterSpacing: -0.5,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  resetText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  stepBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textTertiary,
  },
  stepNumActive: {
    color: "#fff",
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  stepConnector: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    marginBottom: 14,
  },
  stepConnectorActive: {
    backgroundColor: Colors.primary,
  },
  section: {
    gap: 18,
  },
  sectionHead: {
    gap: 4,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  uploadGrid: {
    flexDirection: "row",
    gap: 14,
  },
  uploadCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  uploadIconRing: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  uploadSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  tipsCard: {
    backgroundColor: Colors.accentLight,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,179,71,0.2)",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  tipsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  photoPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  thumbImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  photoPreviewInfo: {
    gap: 3,
  },
  photoPreviewTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  photoPreviewSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  changePhotoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
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
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: "#fff",
  },
  stylesRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    paddingBottom: 8,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  outlineBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.primary,
  },
  generatedImageContainer: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  generatedImage: {
    width: "100%",
    height: width - 40,
    backgroundColor: Colors.surfaceSecondary,
  },
  styleBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  styleBadgeText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
  },
  sharePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
  },
  sharePreviewInfo: {
    gap: 4,
  },
  sharePreviewName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  sharePreviewStyle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  ghostBtnText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
