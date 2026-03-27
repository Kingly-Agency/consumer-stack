import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPets, createPet, deletePet } from "@workspace/api-client-react";
import * as ImagePicker from "expo-image-picker";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Colors from "@/constants/colors";

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Other"];

const PET_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  dog: { color: "#FF6B35", bg: "#FFF0EB" },
  cat: { color: "#9C27B0", bg: "#F3E5F5" },
  bird: { color: "#2196F3", bg: "#E3F2FD" },
  rabbit: { color: "#4CAF50", bg: "#E8F5E9" },
  hamster: { color: "#FF9800", bg: "#FFF3E0" },
  fish: { color: "#00BCD4", bg: "#E0F7FA" },
  other: { color: "#E91E63", bg: "#FCE4EC" },
};

const PET_EMOJIS: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  bird: "🐦",
  rabbit: "🐰",
  hamster: "🐹",
  fish: "🐠",
  other: "🐾",
};

export default function PetsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Dog");
  const [breed, setBreed] = useState("");
  const [petImage, setPetImage] = useState<string | null>(null);

  const { data: pets, isLoading, refetch } = useQuery({
    queryKey: ["pets"],
    queryFn: () => listPets(),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      createPet({ name, type, breed: breed || undefined, imageData: petImage || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setName("");
      setType("Dog");
      setBreed("");
      setPetImage(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deletePet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pets"] }),
  });

  const pickPetImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setPetImage(result.assets[0].base64);
    }
  };

  const handleDelete = (id: string, petName: string) => {
    Alert.alert("Remove Pet", `Remove ${petName} from your pets?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeMutation.mutate(id) },
    ]);
  };

  const getTypeStyle = (t: string) =>
    PET_TYPE_COLORS[t.toLowerCase()] ?? PET_TYPE_COLORS.other;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>My Pets</Text>
          {pets && pets.length > 0 && (
            <Text style={styles.headerSub}>{pets.length} pet{pets.length !== 1 ? "s" : ""}</Text>
          )}
        </View>
        <Pressable onPress={() => setShowModal(true)} style={styles.addBtn} testID="add-pet-btn">
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={pets ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const tc = getTypeStyle(item.type);
            const emoji = PET_EMOJIS[item.type.toLowerCase()] ?? "🐾";
            return (
              <Pressable
                style={styles.petCard}
                onLongPress={() => handleDelete(item.id, item.name)}
                testID={`pet-card-${item.id}`}
              >
                {item.imageData ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${item.imageData}` }}
                    style={styles.petImage}
                  />
                ) : (
                  <View style={[styles.petImagePlaceholder, { backgroundColor: tc.bg }]}>
                    <Text style={styles.petEmoji}>{emoji}</Text>
                  </View>
                )}
                <View style={styles.petInfo}>
                  <Text style={styles.petName} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.typePill, { backgroundColor: tc.bg }]}>
                    <Text style={[styles.typeLabel, { color: tc.color }]}>{item.type}</Text>
                  </View>
                  {item.breed ? (
                    <Text style={styles.petBreed} numberOfLines={1}>{item.breed}</Text>
                  ) : null}
                </View>
                <View style={styles.longPressHint}>
                  <Feather name="more-vertical" size={14} color={Colors.textTertiary} />
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🐾</Text>
              <Text style={styles.emptyTitle}>No pets yet</Text>
              <Text style={styles.emptyText}>
                Add your furry, feathery, or scaly friends to start creating AI portraits!
              </Text>
              <Pressable onPress={() => setShowModal(true)} style={styles.emptyBtn}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add your first pet</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={
            pets && pets.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add a Pet</Text>
            <Pressable onPress={() => setShowModal(false)} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.text} />
            </Pressable>
          </View>

          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContent}
          >
            <Pressable onPress={pickPetImage} style={styles.photoUpload}>
              {petImage ? (
                <Image source={{ uri: `data:image/jpeg;base64,${petImage}` }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="camera" size={28} color={Colors.primary} />
                  <Text style={styles.photoPlaceholderText}>Add photo</Text>
                </View>
              )}
            </Pressable>

            <TextInput
              style={styles.input}
              placeholder="Pet name *"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              testID="pet-name-modal-input"
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {PET_TYPES.map((t) => {
                  const emoji = PET_EMOJIS[t.toLowerCase()] ?? "🐾";
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      style={[styles.typeChip, type === t && styles.typeChipActive]}
                    >
                      <Text style={styles.typeChipEmoji}>{emoji}</Text>
                      <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Breed (optional)"
              placeholderTextColor={Colors.textTertiary}
              value={breed}
              onChangeText={setBreed}
            />

            <Pressable
              onPress={() => addMutation.mutate()}
              disabled={!name.trim() || addMutation.isPending}
              style={[styles.saveBtn, (!name.trim() || addMutation.isPending) && styles.saveBtnDisabled]}
              testID="save-pet-btn"
            >
              {addMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>Add Pet</Text>
                </>
              )}
            </Pressable>
          </KeyboardAwareScrollView>
        </View>
      </Modal>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  listContent: {
    padding: 16,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  petCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  petImage: {
    width: "100%",
    aspectRatio: 1,
  },
  petImagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  petEmoji: {
    fontSize: 48,
  },
  petInfo: {
    padding: 12,
    gap: 6,
  },
  petName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  typePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  petBreed: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  longPressHint: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 12,
    padding: 4,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 50,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  photoUpload: {
    alignSelf: "center",
    marginBottom: 4,
  },
  photoPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  photoPlaceholderText: {
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
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: -4,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  typeChipActive: {
    backgroundColor: Colors.primaryLighter,
    borderColor: Colors.primary,
  },
  typeChipEmoji: {
    fontSize: 16,
  },
  typeChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
