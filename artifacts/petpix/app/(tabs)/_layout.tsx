import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const isIOS = Platform.OS === "ios";

function TabIcon({
  icon,
  iosIcon,
  iosFocusedIcon,
  color,
  focused,
}: {
  icon: React.ReactNode;
  iosIcon?: string;
  iosFocusedIcon?: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={tabStyles.iconWrap}>
      {icon}
      {focused && <View style={tabStyles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginTop: 0,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "web" ? 84 : 82,
          paddingBottom: Platform.OS === "web" ? 12 : 24,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {isIOS ? (
              <BlurView intensity={90} tint="extraLight" style={StyleSheet.absoluteFill} />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: "rgba(255,255,255,0.97)",
                    borderTopWidth: 0.5,
                    borderTopColor: Colors.borderLight,
                  },
                ]}
              />
            )}
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              {isIOS ? (
                <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={22} />
              ) : (
                <Feather name="home" size={22} color={color} />
              )}
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              {isIOS ? (
                <SymbolView name={focused ? "globe.americas.fill" : "globe.americas"} tintColor={color} size={22} />
              ) : (
                <Feather name="globe" size={22} color={color} />
              )}
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={styles.createIconWrapper}>
              <LinearGradient
                colors={focused ? ["#FF8C5A", "#FF6B35"] : ["#FF6B35", "#E8521E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.createIcon, focused && styles.createIconFocused]}
              >
                <Feather name="plus" size={28} color="#fff" />
              </LinearGradient>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: "My Pets",
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              {isIOS ? (
                <SymbolView name={focused ? "pawprint.fill" : "pawprint"} tintColor={color} size={22} />
              ) : (
                <MaterialCommunityIcons name={focused ? "paw" : "paw-outline"} size={22} color={color} />
              )}
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              {isIOS ? (
                <SymbolView name={focused ? "person.fill" : "person"} tintColor={color} size={22} />
              ) : (
                <Feather name="user" size={22} color={color} />
              )}
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    gap: 3,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});

const styles = StyleSheet.create({
  createIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  createIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 10,
  },
  createIconFocused: {
    transform: [{ scale: 1.05 }],
  },
});
