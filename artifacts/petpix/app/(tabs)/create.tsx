import React, { useState, useRef, useEffect } from "react";
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
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";
import { ART_STYLES, ArtStyle } from "@/components/StyleCard";
import { generateOpenaiImage, createPost, listPets } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { useLocalSearchParams } from "expo-router";

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Other"];
const { width } = Dimensions.get("window");

const STEPS = ["Photo", "Style", "Result", "Share"];
type Step = "upload" | "style" | "preview" | "share";
const STEP_LIST: Step[] = ["upload", "style", "preview", "share"];

const PET_TYPE_EMOJIS: Record<string, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰",
  hamster: "🐹", fish: "🐠", other: "🐾",
};

const GENERATION_MESSAGES = [
  "Analyzing your pet's features…",
  "Mixing digital paint…",
  "Applying artistic style…",
  "Enhancing details…",
  "Adding finishing sparkles…",
  "Almost ready…",
];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { userName, displayName } = useApp();
  const toast = useToast();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { petId: petIdParam } = useLocalSearchParams<{ petId?: string }>();

  const [step, setStep] = useState<Step>("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(null);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("Dog");
  const [caption, setCaption] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [genMessageIdx, setGenMessageIdx] = useState(0);

  const stepIndex = STEP_LIST.indexOf(step);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const imageRevealAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const genMsgAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isGenerating) {
      progressAnim.setValue(0);
      setGenMessageIdx(0);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 1100, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -12, duration: 2000, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();

      Animated.timing(progressAnim, { toValue: 0.9, duration: 24000, useNativeDriver: false }).start();

      const interval = setInterval(() => {
        Animated.timing(genMsgAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setGenMessageIdx((i) => (i + 1) % GENERATION_MESSAGES.length);
          Animated.timing(genMsgAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
      }, 3800);
      return () => clearInterval(interval);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      floatAnim.stopAnimation();
      floatAnim.setValue(0);
      progressAnim.setValue(0);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (step === "preview") {
      imageRevealAnim.setValue(0);
      shimmerAnim.setValue(0);
      Animated.spring(imageRevealAnim, {
        toValue: 1,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [step]);

  const { data: savedPets } = useQuery({
    queryKey: ["pets"],
    queryFn: () => listPets(),
  });

  React.useEffect(() => {
    if (petIdParam && savedPets) {
      const pet = savedPets.find((p) => p.id === petIdParam);
      if (pet) {
        setSelectedPetId(pet.id);
        setPetName(pet.name);
        setPetType(pet.type);
      }
    }
  }, [petIdParam, savedPets]);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const selectSavedPet = (pet: { id: string; name: string; type: string }) => {
    setSelectedPetId(pet.id);
    setPetName(pet.name);
    setPetType(pet.type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const generateImage = async () => {
    if (!selectedStyle && !customPrompt) {
      toast.show("Pick a style", { type: "info", subtitle: "Choose an art style to continue" });
      return;
    }
    if (!petName.trim()) {
      toast.show("Pet name required", { type: "info", subtitle: "Enter your pet's name" });
      return;
    }
    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const stylePrompt = selectedStyle?.prompt ?? "";
      const prompt = `A ${petType.toLowerCase()} named ${petName}, ${stylePrompt}${customPrompt ? `. ${customPrompt}` : ""}. High quality, professional composition, adorable pet portrait.`;
      const result = await generateOpenaiImage({ prompt, size: "1024x1024" });
      setGeneratedImage(result.b64_json);
      setStep("preview");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      toast.show("Generation failed", { type: "error", subtitle: "Could not generate image. Please try again." });
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
        userName: displayName || userName,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      toast.show("Posted! 🎉", { subtitle: "Your portrait is live on the community feed" });
    },
    onError: () => {
      toast.show("Post failed", { type: "error", subtitle: "Could not share your portrait. Try again." });
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
    setSelectedPetId(null);
  };

  const canGenerate = petName.trim() && (!!selectedStyle || customPrompt.trim());
  const petEmoji = PET_TYPE_EMOJIS[petType.toLowerCase()] ?? "🐾";

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
          <View>
            <Text style={styles.headerTitle}>Create</Text>
            <Text style={styles.headerSub}>AI Pet Portraits</Text>
          </View>
          {step !== "upload" && (
            <Pressable onPress={resetForm} style={styles.resetBtn}>
              <Feather name="x" size={14} color={Colors.textSecondary} />
              <Text style={styles.resetText}>Start over</Text>
            </Pressable>
          )}
        </View>

        {/* Step indicator */}
        <View style={styles.stepBar}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  i < stepIndex && styles.stepCircleDone,
                  i === stepIndex && styles.stepCircleActive,
                ]}>
                  {i < stepIndex ? (
                    <Feather name="check" size={11} color="#fff" />
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

        {/* ─── STEP 1: Upload ─── */}
        {step === "upload" && (
          <View style={styles.section}>
            <Pressable onPress={pickImage} style={styles.heroUploadZone} testID="pick-image">
              <LinearGradient
                colors={[Colors.primaryLighter, "#fff7f4"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.heroUploadInner}>
                <View style={styles.heroIconStack}>
                  <View style={styles.heroIconRingOuter} />
                  <View style={styles.heroIconRingInner}>
                    <Feather name="image" size={38} color={Colors.primary} />
                  </View>
                </View>
                <Text style={styles.heroUploadTitle}>Choose a pet photo</Text>
                <Text style={styles.heroUploadSub}>Tap to browse your gallery</Text>
                <View style={styles.heroUploadBadge}>
                  <Feather name="upload" size={12} color={Colors.primary} />
                  <Text style={styles.heroUploadBadgeText}>Select photo</Text>
                </View>
              </View>
            </Pressable>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            <Pressable onPress={takePhoto} style={styles.cameraBtn} testID="take-photo">
              <View style={styles.cameraBtnIcon}>
                <Feather name="camera" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.cameraBtnText}>Take a new photo</Text>
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            </Pressable>

            <View style={styles.tipsRow}>
              {[
                { icon: "sun", tip: "Good lighting" },
                { icon: "zoom-in", tip: "Clear face" },
                { icon: "crop", tip: "Square crop" },
              ].map(({ icon, tip }) => (
                <View key={tip} style={styles.tipChip}>
                  <Feather name={icon as any} size={13} color={Colors.accent} />
                  <Text style={styles.tipChipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── STEP 2: Style ─── */}
        {step === "style" && (
          <View style={styles.section}>
            {/* Photo + pet info side by side */}
            {originalImage && (
              <View style={styles.styleBannerCard}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${originalImage}` }}
                  style={styles.styleBannerImage}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.65)"]}
                  style={styles.styleBannerGradient}
                />
                <View style={styles.styleBannerOverlay}>
                  <View style={styles.styleBannerReady}>
                    <View style={styles.styleBannerReadyDot} />
                    <Text style={styles.styleBannerReadyText}>Photo ready</Text>
                  </View>
                  <Pressable onPress={pickImage} style={styles.styleBannerChangeBtn}>
                    <Feather name="refresh-cw" size={13} color="#fff" />
                    <Text style={styles.styleBannerChangeTxt}>Change</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Saved pets */}
            {savedPets && savedPets.length > 0 && (
              <View>
                <Text style={styles.fieldLabel}>Your pets</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.savedPetsRow}>
                    {savedPets.map((pet) => {
                      const emoji = PET_TYPE_EMOJIS[pet.type.toLowerCase()] ?? "🐾";
                      const isSelected = selectedPetId === pet.id;
                      return (
                        <Pressable
                          key={pet.id}
                          onPress={() => selectSavedPet(pet)}
                          style={[styles.savedPetChip, isSelected && styles.savedPetChipActive]}
                        >
                          {pet.imageData ? (
                            <Image
                              source={{ uri: `data:image/jpeg;base64,${pet.imageData}` }}
                              style={[styles.savedPetAvatar, isSelected && styles.savedPetAvatarActive]}
                            />
                          ) : (
                            <View style={[styles.savedPetAvatarPlaceholder, isSelected && styles.savedPetAvatarPlaceholderActive]}>
                              <Text style={styles.savedPetEmoji}>{emoji}</Text>
                            </View>
                          )}
                          <Text style={[styles.savedPetName, isSelected && styles.savedPetNameActive]} numberOfLines={1}>
                            {pet.name}
                          </Text>
                          {isSelected && (
                            <View style={styles.savedPetCheck}>
                              <Feather name="check" size={10} color="#fff" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => { setSelectedPetId(null); setPetName(""); setPetType("Dog"); }}
                      style={styles.savedPetChip}
                    >
                      <View style={styles.savedPetAvatarNew}>
                        <Feather name="plus" size={18} color={Colors.primary} />
                      </View>
                      <Text style={styles.savedPetNewText}>New</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Pet name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Pet name</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Mango, Luna, Biscuit…"
                placeholderTextColor={Colors.textTertiary}
                value={petName}
                onChangeText={(t) => { setPetName(t); setSelectedPetId(null); }}
                testID="pet-name-input"
              />
            </View>

            {/* Pet type */}
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
                      <Text style={styles.chipEmoji}>{PET_TYPE_EMOJIS[type.toLowerCase()] ?? "🐾"}</Text>
                      <Text style={[styles.chipText, petType === type && styles.chipTextActive]}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Art style grid */}
            <View>
              <Text style={styles.fieldLabel}>Art style</Text>
              <View style={styles.styleGrid}>
                {ART_STYLES.map((s) => {
                  const isSelected = selectedStyle?.id === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => {
                        setSelectedStyle(isSelected ? null : s);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[styles.styleGridCard, isSelected && styles.styleGridCardActive]}
                    >
                      <LinearGradient
                        colors={isSelected ? [s.colors[0], s.colors[1]] : ["#F8F7F5", "#F2F1EF"]}
                        style={styles.styleGridGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <Text style={styles.styleGridEmoji}>{s.emoji}</Text>
                      <Text style={[styles.styleGridName, isSelected && styles.styleGridNameActive]}>{s.name}</Text>
                      <Text style={[styles.styleGridDesc, isSelected && styles.styleGridDescActive]}>{s.description}</Text>
                      {isSelected && (
                        <View style={styles.styleGridCheck}>
                          <Feather name="check" size={10} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Extra details */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Extra details <Text style={styles.inputLabelOptional}>(optional)</Text></Text>
              <TextInput
                style={[styles.inputField, styles.inputMultiline]}
                placeholder={'"with a bow tie", "in a garden", "at sunset"…'}
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
              style={[styles.generateBtn, (!canGenerate || isGenerating) && styles.generateBtnDisabled]}
              testID="generate-btn"
            >
              <LinearGradient
                colors={canGenerate && !isGenerating ? [Colors.primary, Colors.primaryLight] : ["#ccc", "#ccc"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.generateBtnText}>Generating…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateBtnText}>Generate AI Portrait</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* ─── STEP 3: Preview (Generated Result) ─── */}
        {step === "preview" && generatedImage && (
          <View style={styles.section}>
            {/* Celebration header */}
            <View style={styles.celebrationRow}>
              <Text style={styles.celebrationSparkle}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.celebrationTitle}>Your portrait is ready!</Text>
                <Text style={styles.celebrationSub}>
                  {petName} looks amazing in {selectedStyle?.name ?? "custom"} style
                </Text>
              </View>
              <Text style={styles.celebrationSparkle}>🎉</Text>
            </View>

            {/* Generated image — large, animated reveal */}
            <Animated.View
              style={[
                styles.resultImageWrap,
                {
                  opacity: imageRevealAnim,
                  transform: [{ scale: imageRevealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
                },
              ]}
            >
              <Image
                source={{ uri: `data:image/png;base64,${generatedImage}` }}
                style={styles.resultImage}
                resizeMode="cover"
              />
              {/* Style badge overlay */}
              {selectedStyle && (
                <View style={styles.resultStyleBadge}>
                  <LinearGradient
                    colors={[selectedStyle.colors[0], selectedStyle.colors[1]]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.resultStyleEmoji}>{selectedStyle.emoji}</Text>
                  <Text style={styles.resultStyleName}>{selectedStyle.name}</Text>
                </View>
              )}
              {/* Shimmer overlay */}
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: shimmerAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.08, 0] }),
                    backgroundColor: "#fff",
                    borderRadius: 24,
                  },
                ]}
              />
            </Animated.View>

            {/* Before / After */}
            {originalImage && (
              <View style={styles.beforeAfterCard}>
                <Text style={styles.beforeAfterTitle}>Before & After</Text>
                <View style={styles.beforeAfterRow}>
                  <View style={styles.beforeAfterItem}>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${originalImage}` }}
                      style={styles.beforeAfterThumb}
                    />
                    <View style={styles.beforeAfterLabelWrap}>
                      <Text style={styles.beforeAfterLabel}>Original</Text>
                    </View>
                  </View>
                  <View style={styles.beforeAfterArrow}>
                    <LinearGradient
                      colors={[Colors.primary, Colors.accent]}
                      style={styles.arrowGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                    <Feather name="arrow-right" size={16} color="#fff" style={{ position: "absolute" }} />
                  </View>
                  <View style={styles.beforeAfterItem}>
                    <Image
                      source={{ uri: `data:image/png;base64,${generatedImage}` }}
                      style={styles.beforeAfterThumb}
                    />
                    <View style={[styles.beforeAfterLabelWrap, { backgroundColor: Colors.primary }]}>
                      <Text style={[styles.beforeAfterLabel, { color: "#fff" }]}>AI Art</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.resultActions}>
              <Pressable onPress={() => setStep("style")} style={styles.retryBtn}>
                <Feather name="refresh-cw" size={16} color={Colors.primary} />
                <Text style={styles.retryBtnText}>Try again</Text>
              </Pressable>
              <Pressable onPress={() => setStep("share")} style={styles.shareForwardBtn}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryLight]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.shareForwardBtnText}>Share it</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── STEP 4: Share ─── */}
        {step === "share" && generatedImage && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Share to community</Text>
              <Text style={styles.sectionSub}>Add a caption and let everyone see your portrait</Text>
            </View>

            {/* Post preview */}
            <View style={styles.postCard}>
              <View style={styles.postCardHeader}>
                <View style={styles.postCardAvatar}>
                  <Text style={styles.postCardAvatarLetter}>
                    {(displayName || userName || "P").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.postCardUser}>{displayName || userName}</Text>
                  <View style={styles.postCardMeta}>
                    <View style={styles.postCardTag}>
                      <Text style={styles.postCardTagText}>{petName || "Your pet"}</Text>
                    </View>
                    <Text style={styles.postCardType}>· {petType}</Text>
                  </View>
                </View>
                {selectedStyle && (
                  <View style={styles.postCardStyleBadge}>
                    <Text style={styles.postCardStyleEmoji}>{selectedStyle.emoji}</Text>
                    <Text style={styles.postCardStyleName}>{selectedStyle.name}</Text>
                  </View>
                )}
              </View>
              <Image
                source={{ uri: `data:image/png;base64,${generatedImage}` }}
                style={styles.postCardImage}
                resizeMode="cover"
              />
              {caption ? (
                <Text style={styles.postCardCaption}>
                  <Text style={styles.postCardCaptionUser}>{displayName || userName} </Text>
                  {caption}
                </Text>
              ) : (
                <Text style={styles.postCardCaptionPlaceholder}>Your caption will appear here…</Text>
              )}
            </View>

            {/* Caption input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Caption <Text style={styles.inputLabelOptional}>(optional)</Text></Text>
              <TextInput
                style={[styles.inputField, styles.inputMultiline]}
                placeholder="Write something about your pet's portrait…"
                placeholderTextColor={Colors.textTertiary}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
              />
            </View>

            <Pressable
              onPress={() => postMutation.mutate()}
              disabled={postMutation.isPending}
              style={[styles.generateBtn, postMutation.isPending && styles.generateBtnDisabled]}
              testID="share-btn"
            >
              <LinearGradient
                colors={postMutation.isPending ? ["#ccc", "#ccc"] : [Colors.primary, Colors.primaryLight]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              {postMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#fff" />
                  <Text style={styles.generateBtnText}>Post to Community</Text>
                </>
              )}
            </Pressable>

            <Pressable onPress={resetForm} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>Discard and start over</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* ─── AI Generation overlay ─── */}
      {isGenerating && (
        <View style={[StyleSheet.absoluteFill, styles.generatingOverlay]}>
          <LinearGradient
            colors={["rgba(30,20,10,0.96)", "rgba(60,30,10,0.92)"]}
            style={StyleSheet.absoluteFill}
          />
          {/* Decorative circles */}
          <View style={[styles.glowCircle, styles.glowCircle1]} />
          <View style={[styles.glowCircle, styles.glowCircle2]} />

          <View style={styles.generatingContent}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }, { translateY: floatAnim }] }}>
              <LinearGradient
                colors={[Colors.primaryLighter, Colors.accentLight]}
                style={styles.generatingEmojiRing}
              >
                <Text style={styles.generatingEmoji}>{petEmoji}</Text>
              </LinearGradient>
            </Animated.View>

            <Text style={styles.generatingTitle}>Creating your masterpiece</Text>

            <Animated.Text style={[styles.generatingMsg, { opacity: genMsgAnim }]}>
              {GENERATION_MESSAGES[genMessageIdx]}
            </Animated.Text>

            <View style={styles.generatingProgressTrack}>
              <Animated.View
                style={[
                  styles.generatingProgressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>

            <View style={styles.generatingStylePill}>
              {selectedStyle && <Text style={styles.generatingStyleEmoji}>{selectedStyle.emoji}</Text>}
              <Text style={styles.generatingStyleText}>
                {selectedStyle?.name ?? "Custom"} style · {petName || "Your pet"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const CARD_SIZE = (width - 40 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  stepItem: { alignItems: "center", gap: 4 },
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  stepCircleDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textTertiary,
  },
  stepNumActive: { color: "#fff" },
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
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    marginBottom: 14,
    borderRadius: 1,
  },
  stepConnectorActive: { backgroundColor: Colors.primary },

  section: { gap: 20 },
  sectionHead: { gap: 4 },
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

  // ── Upload step ──
  heroUploadZone: {
    height: 220,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  heroUploadInner: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  heroIconStack: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  heroIconRingOuter: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,107,53,0.12)",
  },
  heroIconRingInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,107,53,0.25)",
  },
  heroUploadTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  heroUploadSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  heroUploadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    marginTop: 4,
  },
  heroUploadBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textTertiary,
  },

  cameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cameraBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBtnText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },

  tipsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  tipChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
  },
  tipChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.text,
  },

  // ── Style step ──
  styleBannerCard: {
    height: 130,
    borderRadius: 22,
    overflow: "hidden",
  },
  styleBannerImage: {
    width: "100%",
    height: "100%",
  },
  styleBannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  styleBannerOverlay: {
    position: "absolute",
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  styleBannerReady: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  styleBannerReadyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  styleBannerReadyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  styleBannerChangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 50,
  },
  styleBannerChangeTxt: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#fff",
  },

  savedPetsRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 4,
  },
  savedPetChip: {
    alignItems: "center",
    gap: 5,
    width: 66,
    position: "relative",
  },
  savedPetChipActive: { opacity: 1 },
  savedPetAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: Colors.border,
  },
  savedPetAvatarActive: {
    borderColor: Colors.primary,
  },
  savedPetAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: Colors.border,
  },
  savedPetAvatarPlaceholderActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLighter,
  },
  savedPetEmoji: { fontSize: 24 },
  savedPetName: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  savedPetNameActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  savedPetCheck: {
    position: "absolute",
    top: 0,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  savedPetAvatarNew: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  savedPetNewText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.primary,
  },

  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  inputWrapper: { gap: 8 },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  inputLabelOptional: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  inputField: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },

  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: Colors.primaryLighter,
    borderColor: Colors.primary,
  },
  chipEmoji: { fontSize: 14 },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },

  // Style grid (2 columns)
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  styleGridCard: {
    width: CARD_SIZE,
    height: CARD_SIZE * 0.85,
    borderRadius: 18,
    overflow: "hidden",
    padding: 14,
    justifyContent: "flex-end",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  styleGridCardActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  styleGridGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  styleGridEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  styleGridName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  styleGridNameActive: {
    color: Colors.text,
  },
  styleGridDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  styleGridDescActive: {
    color: Colors.textSecondary,
  },
  styleGridCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  // Generate button
  generateBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  generateBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  generateBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#fff",
    letterSpacing: 0.2,
  },

  // ── Preview/Result step ──
  celebrationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primaryLighter,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.15)",
  },
  celebrationSparkle: {
    fontSize: 24,
  },
  celebrationTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  celebrationSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  resultImageWrap: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  resultImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
  },
  resultStyleBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    overflow: "hidden",
  },
  resultStyleEmoji: { fontSize: 14 },
  resultStyleName: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#fff",
  },

  beforeAfterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  beforeAfterTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  beforeAfterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  beforeAfterItem: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  beforeAfterThumb: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
  },
  beforeAfterLabelWrap: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  beforeAfterLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  beforeAfterArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  resultActions: {
    flexDirection: "row",
    gap: 12,
  },
  retryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: Colors.primaryLighter,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  retryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.primary,
  },
  shareForwardBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  shareForwardBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },

  // ── Share step ──
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  postCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  postCardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  postCardAvatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  postCardUser: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  postCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  postCardTag: {
    backgroundColor: Colors.primaryLighter,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 50,
  },
  postCardTagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.primary,
  },
  postCardType: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  postCardStyleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
  },
  postCardStyleEmoji: { fontSize: 11 },
  postCardStyleName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  postCardImage: {
    width: "100%",
    aspectRatio: 1,
  },
  postCardCaption: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    lineHeight: 20,
  },
  postCardCaptionUser: {
    fontFamily: "Inter_600SemiBold",
  },
  postCardCaptionPlaceholder: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textTertiary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontStyle: "italic",
  },

  ghostBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  ghostBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textTertiary,
  },

  // ── Generating overlay ──
  generatingOverlay: {
    justifyContent: "center",
    alignItems: "center",
  },
  glowCircle: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.15,
  },
  glowCircle1: {
    width: 300,
    height: 300,
    backgroundColor: Colors.primary,
    top: -80,
    right: -80,
  },
  glowCircle2: {
    width: 250,
    height: 250,
    backgroundColor: Colors.accent,
    bottom: -60,
    left: -60,
  },
  generatingContent: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 36,
  },
  generatingEmojiRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  generatingEmoji: {
    fontSize: 56,
  },
  generatingTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  generatingMsg: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  generatingProgressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  generatingProgressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  generatingStylePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  generatingStyleEmoji: { fontSize: 16 },
  generatingStyleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
});
