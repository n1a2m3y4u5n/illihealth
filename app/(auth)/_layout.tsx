import { Stack } from 'expo-router';

// 인증 플로우 레이아웃 — 헤더 없음
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="picto-pin-setup" />
      <Stack.Screen name="picto-pin-login" />
      <Stack.Screen name="tutorial" />
    </Stack>
  );
}
