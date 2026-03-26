import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

export interface ArtStyle {
  id: string;
  name: string;
  emoji: string;
  description: string;
  prompt: string;
}

export const ART_STYLES: ArtStyle[] = [
  {
    id: "cartoon",
    name: "Cartoon",
    emoji: "cartoon",
    description: "Fun & colorful",
    prompt: "cute cartoon style illustration, vibrant colors, flat design, friendly and playful",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    emoji: "watercolor",
    description: "Soft & artistic",
    prompt: "beautiful watercolor painting, soft pastel colors, artistic brush strokes, dreamy aesthetic",
  },
  {
    id: "oil-painting",
    name: "Oil Painting",
    emoji: "oil",
    description: "Classic & refined",
    prompt: "oil painting portrait, rich colors, classic fine art style, detailed brushwork, museum quality",
  },
  {
    id: "pop-art",
    name: "Pop Art",
    emoji: "popart",
    description: "Bold & graphic",
    prompt: "pop art style, bold colors, halftone dots, Andy Warhol inspired, high contrast graphic art",
  },
  {
    id: "sketch",
    name: "Sketch",
    emoji: "sketch",
    description: "Pencil art",
    prompt: "detailed pencil sketch, fine line art, black and white illustration, artistic drawing style",
  },
  {
    id: "pixel",
    name: "Pixel Art",
    emoji: "pixel",
    description: "8-bit retro",
    prompt: "retro pixel art style, 8-bit illustration, cute pixelated design, vibrant colors",
  },
  {
    id: "anime",
    name: "Anime",
    emoji: "anime",
    description: "Japanese anime",
    prompt: "cute anime style illustration, big expressive eyes, Japanese animation art style, colorful",
  },
  {
    id: "3d-render",
    name: "3D Render",
    emoji: "3d",
    description: "Dimensional",
    prompt: "3D rendered illustration, Pixar-like style, soft lighting, cute and realistic 3D art",
  },
];

const STYLE_ICONS: Record<string, { name: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  cartoon: { name: "smile", color: "#FF6B35", bg: "#FFF0EB" },
  watercolor: { name: "droplet", color: "#4FC3F7", bg: "#E1F5FE" },
  oil: { name: "image", color: "#AB47BC", bg: "#F3E5F5" },
  popart: { name: "zap", color: "#FFB300", bg: "#FFF8E1" },
  sketch: { name: "edit-2", color: "#546E7A", bg: "#ECEFF1" },
  pixel: { name: "grid", color: "#26A69A", bg: "#E0F2F1" },
  anime: { name: "star", color: "#EC407A", bg: "#FCE4EC" },
  "3d": { name: "box", color: "#5C6BC0", bg: "#E8EAF6" },
};

interface StyleCardProps {
  style: ArtStyle;
  selected: boolean;
  onSelect: (style: ArtStyle) => void;
}

export function StyleCard({ style, selected, onSelect }: StyleCardProps) {
  const icon = STYLE_ICONS[style.emoji] ?? { name: "image" as keyof typeof Feather.glyphMap, color: Colors.primary, bg: Colors.primaryLighter };

  return (
    <Pressable
      onPress={() => onSelect(style)}
      style={[styles.card, selected && styles.cardSelected]}
      testID={`style-${style.id}`}
    >
      <View style={[styles.iconBg, { backgroundColor: icon.bg }, selected && styles.iconBgSelected]}>
        <Feather name={icon.name} size={20} color={selected ? Colors.textInverse : icon.color} />
      </View>
      <Text style={[styles.name, selected && styles.nameSelected]}>{style.name}</Text>
      <Text style={styles.description}>{style.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 80,
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    gap: 4,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: Colors.surface,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLighter,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBgSelected: {
    backgroundColor: Colors.primary,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.text,
    textAlign: "center",
  },
  nameSelected: {
    color: Colors.primary,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: "center",
  },
});
