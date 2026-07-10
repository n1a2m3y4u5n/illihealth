// 응급 모드 화면 — 빨강 색군
// 응급 연락처 목록 + 전화 연결 + 현재 복용 중인 약 요약 표시

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { speak } from '../../lib/voice';
import { supabase } from '../../lib/supabase';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

interface ActiveMedication {
  id: string;
  name: string;
  dosage_per_time: number;
}

export default function EmergencyScreen() {
  const router = useRouter();
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [medications, setMedications] = useState<ActiveMedication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (autoTts) {
      void speak(
        language === 'ko' ? '응급 모드입니다. 연락처를 선택해주세요.' : 'Emergency mode. Please select a contact.',
        { lang: language === 'ko' ? 'ko-KR' : 'en-US' }
      );
    }
    void loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    if (!user) { setLoading(false); return; }

    const [contactsRes, medsRes] = await Promise.all([
      supabase
        .from('emergency_contacts')
        .select('id, name, phone, relation')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('medications')
        .select('id, name, dosage_per_time')
        .eq('user_id', user.id)
        .eq('active', true),
    ]);

    if (contactsRes.data) setContacts(contactsRes.data as EmergencyContact[]);
    if (medsRes.data) setMedications(medsRes.data as ActiveMedication[]);
    setLoading(false);
  };

  const handleCall = async (contact: EmergencyContact): Promise<void> => {
    const url = `tel:${contact.phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <Screen hideSos>
      <View style={styles.header}>
        <Text style={styles.title}>🚨</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.red[600]} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 연락처 버튼 목록 */}
          {contacts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📵</Text>
            </View>
          ) : (
            contacts.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.contactCard}
                onPress={() => { void handleCall(c); }}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}에게 전화`}
              >
                <Text style={styles.contactRelation}>{c.relation}</Text>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactPhone}>{c.phone}</Text>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            ))
          )}

          {/* 119 긴급 전화 */}
          <TouchableOpacity
            style={styles.sosCard}
            onPress={() => { void Linking.openURL('tel:119'); }}
            accessibilityRole="button"
            accessibilityLabel="119 응급 전화"
          >
            <Text style={styles.sosIcon}>🚑</Text>
            <Text style={styles.sosText}>119</Text>
          </TouchableOpacity>

          {/* 현재 복용 약 요약 (의료진 전달용) */}
          {medications.length > 0 && (
            <View style={styles.medSection}>
              <Text style={styles.medSectionTitle}>💊</Text>
              <View style={styles.medList}>
                {medications.map((m) => (
                  <View key={m.id} style={styles.medChip}>
                    <Text style={styles.medChipText}>{m.name} {m.dosage_per_time}알</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  title: {
    fontSize: 64,
  },
  backButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[200],
    borderRadius: touchTargets.minTouchTarget / 2,
  },
  backText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[700],
    fontWeight: typography.fontWeights.bold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    gap: 16,
    paddingBottom: 24,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 64,
  },
  contactCard: {
    backgroundColor: colors.red[50],
    borderColor: colors.red[100],
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.minCardSize,
    gap: 12,
  },
  contactRelation: {
    fontSize: typography.fontSizes.sm,
    color: colors.red[600],
    fontWeight: typography.fontWeights.semibold,
  },
  contactName: {
    flex: 1,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  contactPhone: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
  },
  callIcon: {
    fontSize: 36,
  },
  sosCard: {
    backgroundColor: colors.red[600],
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTargets.minCardSize,
    gap: 16,
  },
  sosIcon: {
    fontSize: 48,
  },
  sosText: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  medSection: {
    gap: 8,
  },
  medSectionTitle: {
    fontSize: typography.fontSizes['2xl'],
  },
  medList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  medChip: {
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  medChipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
    fontWeight: typography.fontWeights.semibold,
  },
});
