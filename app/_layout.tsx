import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import { subscribeNetworkFlush } from '../lib/sync';
import { initNotifications } from '../lib/notifications';

// 앱 루트 레이아웃
// Supabase 세션 감지 + 인증 상태에 따른 라우팅
export default function RootLayout() {
  const { setSession } = useAuthStore();

  useEffect(() => {
    void initNotifications();
    const unsubscribeNetwork = subscribeNetworkFlush();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
      unsubscribeNetwork();
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="alarm/[id]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="log/condition" />
        <Stack.Screen name="log/photo" />
      </Stack>
    </>
  );
}
