import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getFavoritesByUser, removeFavorite, Favorite } from '../../database/favorites';
import { getEventById, Event } from '../../database/events';
import { Colors, Shadow, getCategoryStyle, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Badge, EmptyState, Header } from '../../components/ui';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<{ fav: Favorite; event: Event }[]>([]);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    const favs = getFavoritesByUser(user.email);
    const withEvents = favs.map(f => ({ fav: f, event: getEventById(f.eventId)! })).filter(x => x.event);
    setItems(withEvents);
  }, [user]));

  function handleRemove(eventId: string) {
    if (!user) return;
    removeFavorite(eventId, user.email);
    setItems(prev => prev.filter(x => x.fav.eventId !== eventId));
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <Text style={styles.headerLabel}>MES</Text>
        <Text style={styles.headerTitle}>Favoris</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.fav.eventId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={() => router.push({ pathname: '/(student)/event-detail', params: { id: item.event.id } })}>
            <Image source={{ uri: item.event.imageUrl || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80' }} style={styles.cardImg} />
            <View style={styles.cardBody}>
              <Badge label={item.event.category} variant="category" />
              <Text style={styles.cardTitle} numberOfLines={2}>{item.event.title}</Text>
              <View style={styles.cardMeta}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaTxt}>{fmtDate(item.event.startDateTime)}</Text>
                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaTxt}>{item.event.locationName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.event.id)}>
              <Ionicons name="heart" size={20} color={Colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState icon="heart-outline" title="Aucun favori" subtitle="Ajoutez des événements à vos favoris" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.textSecondary, letterSpacing: 2, marginBottom: Spacing.xs },
  headerTitle: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  list: { padding: Spacing.xl, paddingBottom: 120, gap: Spacing.md },
  card: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.level1 },
  cardImg: { width: 100, height: 110 },
  cardBody: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  cardTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  removeBtn: { padding: Spacing.md, justifyContent: 'center' },
});
