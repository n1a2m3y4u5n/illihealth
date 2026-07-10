// 사진 경과 기록 화면 — 분홍 색군
// 시간 순 사진 타임라인 + 새 사진 추가

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../../components/Screen';
import { speak } from '../../lib/voice';
import { supabase } from '../../lib/supabase';
import { usePreferencesStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';
import { colors } from '../../design-tokens/colors';
import { typography } from '../../design-tokens/typography';
import { touchTargets } from '../../design-tokens/touch-targets';
import koJson from '../../locales/ko.json';
import enJson from '../../locales/en.json';

const locales = { ko: koJson, en: enJson };

interface PhotoLogRow {
  id: string;
  photo_url: string;
  note: string | null;
  taken_at: string;
}

export default function LogPhotoScreen() {
  const { language, autoTts } = usePreferencesStore();
  const { user } = useAuthStore();
  const t = locales[language];

  const [photos, setPhotos] = useState<PhotoLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (autoTts) {
      void speak(t.log.photoEnterTts, { lang: language === 'ko' ? 'ko-KR' : 'en-US' });
    }
    void fetchPhotos();
  }, []);

  const fetchPhotos = useCallback(async (): Promise<void> => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('photo_logs')
      .select('id, photo_url, note, taken_at')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false });

    if (data) setPhotos(data as PhotoLogRow[]);
    setLoading(false);
  }, [user]);

  const handleAddPhoto = async (): Promise<void> => {
    if (!user || uploading) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    const asset = result.assets[0];
    const fileExt = asset.uri.split('.').pop() ?? 'jpg';
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    // Storage에 업로드
    const response = await fetch(asset.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('photo-logs')
      .upload(filePath, blob, { contentType: `image/${fileExt}` });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('photo-logs')
        .getPublicUrl(filePath);

      const photoUrl = urlData.publicUrl;

      const { data: newPhoto } = await supabase
        .from('photo_logs')
        .insert({ user_id: user.id, photo_url: photoUrl })
        .select('id, photo_url, note, taken_at')
        .single();

      if (newPhoto) {
        setPhotos((prev) => [newPhoto as PhotoLogRow, ...prev]);
      }
    }

    setUploading(false);
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  };

  const renderItem = ({ item }: { item: PhotoLogRow }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.photo_url }} style={styles.photoImage} resizeMode="cover" />
      <Text style={styles.photoDate}>{formatDate(item.taken_at)}</Text>
    </View>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t.log.photoTitle}</Text>
        <TouchableOpacity
          style={[styles.addButton, uploading && styles.addButtonDisabled]}
          onPress={() => { void handleAddPhoto(); }}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={t.log.photoAdd}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.addIcon}>📸</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink[600]} />
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyText}>{t.log.photoEmpty}</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
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
    color: colors.pink[600],
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: touchTargets.minTouchTarget,
    height: touchTargets.minTouchTarget,
    borderRadius: touchTargets.minTouchTarget / 2,
    backgroundColor: colors.pink[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addIcon: {
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
    paddingBottom: 16,
    gap: 8,
  },
  row: {
    gap: 8,
    justifyContent: 'space-between',
  },
  photoCard: {
    flex: 1,
    gap: 4,
  },
  photoImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
  },
  photoDate: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});
