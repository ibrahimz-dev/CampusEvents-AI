import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getAllEvents, deleteEvent, Event } from '../../database/events';
import { Colors, Shadow, getCategoryStyle, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, EmptyState, Button } from '../../components/ui';

export default function AdminEventsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(() => { setEvents(getAllEvents()); }, []);
  useFocusEffect(useCallback(() => { loadEvents(); }, [loadEvents]));

  function onRefresh() { setRefreshing(true); loadEvents(); setRefreshing(false); }

  function handleDelete(event: Event) {
    Alert.alert('Supprimer', `Supprimer "${event.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { deleteEvent(event.id); loadEvents(); } },
    ]);
  }

  function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => { logout(); router.replace('/'); } },
    ]);
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  function renderCard({ item }: { item: Event }) {
    const cs = getCategoryStyle(item.category);
    const past = new Date(item.startDateTime) < new Date();
    return (
      <View style={[styles.card, past && { opacity: 0.6 }]}>
        <View style={[styles.accent, { backgroundColor: cs.text }]} />
        <View style={styles.cardBody}>
          <Badge label={item.category} variant="category" />
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.meta}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaTxt}>{fmt(item.startDateTime)} • {item.locationName}</Text>
          </View>
          <View style={styles.footer}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: item.capacity && item.registeredCount >= item.capacity ? Colors.error : Colors.success }]} />
              <Text style={styles.regTxt}>{item.registeredCount}{item.capacity ? `/${item.capacity}` : ''} Inscrits</Text>
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.actBtn} onPress={() => router.push({ pathname: '/(admin)/edit', params: { id: item.id } })}>
                <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actBtn, { backgroundColor: Colors.errorBg }]} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <View>
          <Text style={styles.hLabel}>ESPACE</Text>
          <Text style={styles.hTitle}>Admin</Text>
        </View>
        <View style={styles.hRight}>
          <TouchableOpacity style={styles.logBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={events}
        renderItem={renderCard}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="Aucun événement" />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(admin)/create')} activeOpacity={0.9}>
        <View style={styles.fabIn}>
          <Ionicons name="add" size={32} color={Colors.textWhite} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  hLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.textSecondary, letterSpacing: 2, marginBottom: Spacing.xs },
  hTitle: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  hRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  logBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.level1 },
  list: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.level1 },
  accent: { position: 'absolute', top: 0, left: 0, width: 4, height: '100%', opacity: 0.3 },
  cardBody: { padding: Spacing.xl, paddingLeft: Spacing.lg },
  cardTitle: { fontSize: FontSize.subhead, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 24, marginBottom: Spacing.md, marginTop: Spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  metaTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  regTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  actBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  fab: { position: 'absolute', bottom: Spacing.xxl, right: Spacing.xl },
  fabIn: { width: 64, height: 64, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadow.level2 },
});
