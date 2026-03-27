import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { SymbolView } from "expo-symbols";
import Colors from "@/constants/colors";

const isIOS = Platform.OS === "ios";

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
          marginTop: -2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "web" ? 84 : 80,
          paddingBottom: Platform.OS === "web" ? 12 : 24,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {isIOS ? (
              <BlurView intensity={80} tint="extraLight" style={StyleSheet.absoluteFill} />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: "rgba(255,255,255,0.96)",
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
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "globe.americas.fill" : "globe.americas"} tintColor={color} size={22} />
            ) : (
              <Feather name="globe" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={styles.createIconWrapper}>
              <View style={[styles.createIcon, focused && styles.createIconFocused]}>
                <Feather name="plus" size={26} color="#fff" />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: "My Pets",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "pawprint.fill" : "pawprint"} tintColor={color} size={22} />
            ) : (
              <MaterialCommunityIcons name={focused ? "paw" : "paw-outline"} size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "person.fill" : "person"} tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  createIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 10,
  },
  createIconFocused: {
    backgroundColor: Colors.primaryLight,
    transform: [{ scale: 1.05 }],
  },
});
