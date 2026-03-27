import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

export interface ArtStyle {
  id: string;
  name: string;
  emoji: string;
  description: string;
  prompt: string;
  colors: string[];
}

export const ART_STYLES: ArtStyle[] = [
  {
    id: "cartoon",
    name: "Cartoon",
    emoji: "🎨",
    description: "Fun & vivid",
    prompt: "cute cartoon style illustration, vibrant colors, flat design, friendly and playful",
    colors: ["#FF6B35", "#FFB347", "#FFE066"],
  },
  {
    id: "watercolor",
    name: "Watercolor",
    emoji: "💧",
    description: "Soft & dreamy",
    prompt: "beautiful watercolor painting, soft pastel colors, artistic brush strokes, dreamy aesthetic",
    colors: ["#7EC8E3", "#B5E2FA", "#D4A5C9"],
  },
  {
    id: "oil-painting",
    name: "Oil Paint",
    emoji: "🖼️",
    description: "Classic art",
    prompt: "oil painting portrait, rich colors, classic fine art style, detailed brushwork, museum quality",
    colors: ["#8B4513", "#D2691E", "#DAA520"],
  },
  {
    id: "pop-art",
    name: "Pop Art",
    emoji: "⚡",
    description: "Bold & graphic",
    prompt: "pop art style, bold colors, halftone dots, Andy Warhol inspired, high contrast graphic art",
    colors: ["#FF1493", "#FFD700", "#00CED1"],
  },
  {
    id: "sketch",
    name: "Sketch",
    emoji: "✏️",
    description: "Pencil art",
    prompt: "detailed pencil sketch, fine line art, black and white illustration, artistic drawing style",
    colors: ["#4A4A4A", "#7A7A7A", "#B0B0B0"],
  },
  {
    id: "pixel",
    name: "Pixel Art",
    emoji: "👾",
    description: "8-bit retro",
    prompt: "retro pixel art style, 8-bit illustration, cute pixelated design, vibrant colors",
    colors: ["#26A69A", "#80CBC4", "#4DB6AC"],
  },
  {
    id: "anime",
    name: "Anime",
    emoji: "⭐",
    description: "Japanese style",
    prompt: "cute anime style illustration, big expressive eyes, Japanese animation art style, colorful",
    colors: ["#EC407A", "#F48FB1", "#FF80AB"],
  },
  {
    id: "3d-render",
    name: "3D Render",
    emoji: "📦",
    description: "Dimensional",
    prompt: "3D rendered illustration, Pixar-like style, soft lighting, cute and realistic 3D art",
    colors: ["#5C6BC0", "#7986CB", "#9FA8DA"],
  },
];

interface StyleCardProps {
  style: ArtStyle;
  selected: boolean;
  onSelect: (style: ArtStyle) => void;
}

export function StyleCard({ style, selected, onSelect }: StyleCardProps) {
  return (
    <Pressable
      onPress={() => onSelect(style)}
      style={[styles.card, selected && styles.cardSelected]}
      testID={`style-${style.id}`}
    >
      {/* Color swatch */}
      <View style={styles.swatch}>
        {style.colors.map((c, i) => (
          <View
            key={c}
            style={[
              styles.swatchSegment,
              { backgroundColor: c },
              i === 0 && styles.swatchFirst,
              i === style.colors.length - 1 && styles.swatchLast,
            ]}
          />
        ))}
        {selected && (
          <View style={styles.swatchCheck}>
            <Text style={styles.swatchCheckText}>✓</Text>
          </View>
        )}
      </View>
      {/* Emoji + label */}
      <Text style={styles.emoji}>{style.emoji}</Text>
      <Text style={[styles.name, selected && styles.nameSelected]}>{style.name}</Text>
      <Text style={styles.desc}>{style.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 88,
    alignItems: "center",
    gap: 4,
    paddingBottom: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: Colors.surface,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  swatch: {
    width: "100%",
    height: 36,
    flexDirection: "row",
    position: "relative",
    marginBottom: 2,
  },
  swatchSegment: {
    flex: 1,
    height: "100%",
  },
  swatchFirst: {
    borderTopLeftRadius: 16,
  },
  swatchLast: {
    borderTopRightRadius: 16,
  },
  swatchCheck: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  swatchCheckText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  emoji: {
    fontSize: 18,
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
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: "center",
  },
});
