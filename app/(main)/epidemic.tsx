// 감염병 경보 화면 — 빨강 색군
// Supabase Edge Function epidemic-poll로 최신 경보 조회

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { speak } from '../../lib/voice';
import { supabase } from '../../lib/supabase';
import { usePreferencesStore } from '../../stores/preferences';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

// 경보 레벨 1~4
type AlertLevel = 1 | 2 | 3 | 4;

interface EpidemicAlert {
  id: string;
  disease: string;
  level: AlertLevel;
  region: string;
  issued_at: string;
  description: string;
}

const LEVEL_COLORS: Record<AlertLevel, string> = {
  1: colors.amber[100],
  2: colors.amber[600],
  3: colors.red[100],
  4: colors.red[600],
};

const LEVEL_TEXT_COLORS: Record<AlertLevel, string> = {
  1: colors.amber[800],
  2: colors.white,
  3: colors.red[800],
  4: colors.white,
};

export default function EpidemicScreen() {
  const { language, autoTts } = usePreferencesStore();
  const t = locales[language];

  const [alerts, setAlerts] = useState<EpidemicAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (autoTts) {
      void speak(t.prevention.epidemicEnterTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
    void fetchAlerts();
  }, []);

  const fetchAlerts = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('epidemic-poll', {
        body: { lang: language },
      });
      if (Array.isArray(data)) {
        setAlerts(data as EpidemicAlert[]);
      }
    } catch {
      // 오프라인이거나 Edge Function 없음 — 빈 목록
    } finally {
      setLoading(false);
    }
  };

  const levelLabel = (level: AlertLevel): string => {
    const labels: Record<AlertLevel, string> = {
      1: t.prevention.epidemicLevel1,
      2: t.prevention.epidemicLevel2,
      3: t.prevention.epidemicLevel3,
      4: t.prevention.epidemicLevel4,
    };
    return labels[level];
  };

  const renderItem = ({ item }: { item: EpidemicAlert }) => (
    <View style={[styles.card, { borderColor: LEVEL_COLORS[item.level] }]}>
      <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[item.level] }]}>
        <Text style={[styles.levelText, { color: LEVEL_TEXT_COLORS[item.level] }]}>
          {levelLabel(item.level)}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.disease}>🦠 {item.disease}</Text>
        <Text style={styles.region}>📍 {item.region}</Text>
      </View>
    </View>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t.prevention.epidemicTitle}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => { void fetchAlerts(); }}
          accessibilityRole="button"
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.red[600]} />
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>{t.prevention.epidemicEmpty}</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
    marginTop: 8,
    gap: 12,
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.red[600],
  },
  refreshButton: {
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 28,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyIcon: {
    fontSize: 80,
  },
  emptyText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: touchTargets.minCardSize,
  },
  levelBadge: {
    width: 56,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  levelText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
  },
  cardBody: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  disease: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  region: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
});
