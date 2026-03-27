import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  subtitle?: string;
}

interface ToastContextValue {
  show: (title: string, opts?: { type?: ToastType; subtitle?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((title: string, opts?: { type?: ToastType; subtitle?: string }) => {
    const id = ++_counter;
    const toast: ToastMessage = {
      id,
      type: opts?.type ?? "success",
      title,
      subtitle: opts?.subtitle,
    };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { top: insets.top + 12 }]}
      pointerEvents="box-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, damping: 15 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -8, duration: 200, useNativeDriver: true }),
      ]).start();
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const config = TOAST_CONFIG[toast.type];

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.iconBg, { backgroundColor: config.iconBg }]}>
        <Feather name={config.icon as any} size={16} color={config.iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.subtitle ? <Text style={styles.subtitle}>{toast.subtitle}</Text> : null}
      </View>
      <Pressable onPress={() => onDismiss(toast.id)} style={styles.dismissBtn}>
        <Feather name="x" size={14} color={Colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

const TOAST_CONFIG: Record<ToastType, { icon: string; iconBg: string; iconColor: string }> = {
  success: { icon: "check-circle", iconBg: "#E8F5E9", iconColor: Colors.success },
  error: { icon: "alert-circle", iconBg: "#FFEBEE", iconColor: Colors.error },
  info: { icon: "info", iconBg: Colors.accentLight, iconColor: Colors.accent },
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
    pointerEvents: "box-none",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
  },
  iconBg: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dismissBtn: {
    padding: 4,
  },
});
