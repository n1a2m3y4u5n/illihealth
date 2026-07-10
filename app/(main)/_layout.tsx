import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

// 메인 탭 레이아웃
// 미인증 시 welcome으로 리다이렉트
export default function MainLayout() {
  const { session } = useAuthStore();

  // 세션이 없으면 인증 플로우로 이동
  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="library" />
      <Stack.Screen name="log" />
      <Stack.Screen name="share" />
      <Stack.Screen name="emergency" />
      <Stack.Screen name="prevention" />
      <Stack.Screen name="chronic" />
      <Stack.Screen name="vaccine" />
      <Stack.Screen name="epidemic" />
      <Stack.Screen name="prescription-review" />
      <Stack.Screen name="processing" />
    </Stack>
  );
}
