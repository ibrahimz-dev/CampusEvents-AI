import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getAllEvents, searchEvents, getUpcomingEvents, getPastEvents, Event } from '../../database/events';
import { isFavorite, addFavorite, removeFavorite } from '../../database/favorites';
import { Colors, Shadow, getCategoryStyle, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, Chip, EmptyState } from '../../components/ui';

const FILTERS = ['Pour vous', 'Workshop', 'Talk', 'Club', 'Exam', 'Other', 'Passés'] as const;

export default function CatalogScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Pour vous');
  const [refreshing, setRefreshing] = useState(false);
  const [favMap, setFavMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    try {
      setError(null);
      let data: Event[];
      if (search.trim()) {
        data = searchEvents(search);
      } else if (activeFilter === 'Pour vous') {
        data = getUpcomingEvents();
      } else if (activeFilter === 'Passés') {
        data = getPastEvents();
      } else {
        data = getAllEvents().filter(e => e.category === activeFilter);
      }
      setEvents(data);
      if (user) {
        const map: Record<string, boolean> = {};
        data.forEach(e => { map[e.id] = isFavorite(e.id, user.email); });
        setFavMap(map);
      }
    } catch (e) {
      setError('Impossible de charger les événements.');
    }
  }, [search, activeFilter, user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  function toggleFav(eventId: string) {
    if (!user) return;
    if (favMap[eventId]) removeFavorite(eventId, user.email);
    else addFavorite(eventId, user.email);
    setFavMap(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  function renderCard({ item }: { item: Event }) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={() => router.push({ pathname: '/(student)/event-detail', params: { id: item.id } })}>
        <View style={styles.imgWrap}>
          <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80' }} style={styles.img} />
          <View style={styles.imgOverlay} />
          <View style={styles.dateBadge}>
            <Text style={styles.dateTxt}>{fmtDate(item.startDateTime)}</Text>
          </View>
          <TouchableOpacity style={[styles.favBtn, favMap[item.id] && styles.favBtnActive]} onPress={() => toggleFav(item.id)}>
            <Ionicons name={favMap[item.id] ? 'heart' : 'heart-outline'} size={20} color={favMap[item.id] ? Colors.error : Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.imgBottom}>
            <Text style={styles.catLabel}>{item.category}</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.spotsTxt}>
              {item.capacity ? `${item.capacity - item.registeredCount} places` : 'Places illimitées'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerSection, { paddingTop: insets.top + Spacing.xl }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.headerTitle}>Découvrir</Text>
          </View>
        </View>
        <SearchBar
          placeholder="Rechercher un événement..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          data={FILTERS as any}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}
          renderItem={({ item: f }: any) => (
            <Chip
              label={f}
              selected={activeFilter === f}
              onPress={() => { setActiveFilter(f); setSearch(''); }}
            />
          )}
          keyExtractor={(f: any) => f}
        />
      </View>

      <FlatList
        data={events}
        renderItem={renderCard}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); setRefreshing(false); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          error ? (
            <EmptyState icon="alert-circle-outline" title="Erreur" subtitle={error} />
          ) : (
            <EmptyState
              icon="search-outline"
              title={search ? 'Aucun résultat' : 'Aucun événement'}
              subtitle={search ? 'Essayez d\'autres termes' : 'Revenez bientôt !'}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerSection: { paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: Spacing.sm, zIndex: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs },
  headerTitle: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  filterWrap: { paddingVertical: Spacing.md },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120, gap: Spacing.xl },
  card: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.level1, backgroundColor: Colors.surface, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  imgWrap: { height: 260, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  dateBadge: { position: 'absolute', top: Spacing.md, left: Spacing.md, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  dateTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textPrimary, letterSpacing: 1, textTransform: 'uppercase' },
  favBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md, width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  favBtnActive: { backgroundColor: Colors.surface },
  imgBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg },
  catLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.xs, color: Colors.textWhite },
  cardTitle: { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textWhite, lineHeight: 26, marginBottom: Spacing.sm },
  spotsTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: 'rgba(255,255,255,0.8)' },
});
