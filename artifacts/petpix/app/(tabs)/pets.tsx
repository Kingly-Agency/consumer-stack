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

const PET_TYPE_ICONS: Record<string, { name: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  dog: { name: "disc", color: "#FF6B35", bg: "#FFF0EB" },
  cat: { name: "circle", color: "#9C27B0", bg: "#F3E5F5" },
  bird: { name: "feather", color: "#2196F3", bg: "#E3F2FD" },
  rabbit: { name: "activity", color: "#4CAF50", bg: "#E8F5E9" },
  hamster: { name: "sun", color: "#FF9800", bg: "#FFF3E0" },
  fish: { name: "anchor", color: "#00BCD4", bg: "#E0F7FA" },
  other: { name: "heart", color: "#E91E63", bg: "#FCE4EC" },
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

  const { data: pets, isLoading, isError, refetch } = useQuery({
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] });
    },
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
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeMutation.mutate(id),
      },
    ]);
  };

  const getTypeIcon = (type: string) => {
    return PET_TYPE_ICONS[type.toLowerCase()] ?? PET_TYPE_ICONS.other;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={styles.headerTitle}>My Pets</Text>
        <Pressable onPress={() => setShowModal(true)} style={styles.addBtn} testID="add-pet-btn">
          <Feather name="plus" size={20} color={Colors.textInverse} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Failed to load pets</Text>
        </View>
      ) : (
        <FlatList
          data={pets ?? []}
          keyExtractor={(item) => item.id}
          scrollEnabled={!!(pets && pets.length > 0)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const icon = getTypeIcon(item.type);
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
                  <View style={[styles.petImagePlaceholder, { backgroundColor: icon.bg }]}>
                    <Feather name={icon.name} size={36} color={icon.color} />
                  </View>
                )}
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{item.name}</Text>
                  <View style={[styles.typePill, { backgroundColor: icon.bg }]}>
                    <Text style={[styles.typeLabel, { color: icon.color }]}>{item.type}</Text>
                  </View>
                  {item.breed ? (
                    <Text style={styles.petBreed} numberOfLines={1}>{item.breed}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="paw" size={60} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No pets yet</Text>
              <Text style={styles.emptyText}>Add your furry friends to create AI portraits of them!</Text>
              <Pressable onPress={() => setShowModal(true)} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Add your first pet</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={pets && pets.length === 0 ? styles.emptyContainer : styles.listContent}
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
            <Text style={styles.modalTitle}>Add Pet</Text>
            <Pressable onPress={() => setShowModal(false)}>
              <Feather name="x" size={24} color={Colors.text} />
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

            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesRow}>
              {PET_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                </Pressable>
              ))}
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
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.saveBtnText}>Add Pet</Text>
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
    gap: 12,
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
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
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
  petInfo: {
    padding: 12,
    gap: 6,
  },
  petName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
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
  empty: {
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textInverse,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  photoUpload: {
    alignSelf: "center",
    marginBottom: 8,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLighter,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
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
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typesRow: {
    marginTop: -6,
  },
  typeBtn: {
    paddingHorizontal: 16,
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
    fontSize: 13,
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.textInverse,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textInverse,
  },
});
