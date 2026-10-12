import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getRegistrationsByUser, cancelRegistration, Registration } from '../../database/registrations';
import { getEventById, Event } from '../../database/events';
import { Colors, Shadow, getCategoryStyle, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../components/ui';

export default function RegistrationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<{ reg: Registration; event: Event }[]>([]);

  const loadData = useCallback(() => {
    if (!user) return;
    const regs = getRegistrationsByUser(user.email);
    const withEvents = regs.map(r => ({ reg: r, event: getEventById(r.eventId)! })).filter(x => x.event);
    setItems(withEvents);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  function handleCancel(item: { reg: Registration; event: Event }) {
    Alert.alert('Annuler', `Annuler votre inscription à "${item.event.title}" ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => { cancelRegistration(item.event.id, user!.email); loadData(); } },
    ]);
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <Text style={styles.headerLabel}>MES</Text>
        <Text style={styles.headerTitle}>Inscriptions</Text>
        <Text style={styles.count}>{items.length} événement{items.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.reg.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cs = getCategoryStyle(item.event.category);
          const isPast = new Date(item.event.startDateTime) < new Date();
          return (
            <TouchableOpacity style={[styles.card, isPast && { opacity: 0.6 }]} activeOpacity={0.95} onPress={() => router.push({ pathname: '/(student)/event-detail', params: { id: item.event.id } })}>
              <View style={styles.cardLeft}>
                <View style={[styles.dateBox, { backgroundColor: cs.bg }]}>
                  <Text style={[styles.dateDay, { color: cs.text }]}>{new Date(item.event.startDateTime).getDate()}</Text>
                  <Text style={[styles.dateMonth, { color: cs.text }]}>{new Date(item.event.startDateTime).toLocaleDateString('fr-FR', { month: 'short' })}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.event.title}</Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.metaTxt}>{fmtTime(item.event.startDateTime)}</Text>
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.metaTxt}>{item.event.locationName}</Text>
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, isPast ? styles.pastBadge : styles.confirmedBadge]}>
                    <Text style={[styles.statusTxt, isPast ? styles.pastTxt : styles.confirmedTxt]}>
                      {isPast ? 'Terminé' : 'Confirmé'}
                    </Text>
                  </View>
                  {!isPast && (
                    <TouchableOpacity onPress={() => handleCancel(item)} style={styles.cancelBtn}>
                      <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
                      <Text style={styles.cancelTxt}>Annuler</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Aucune inscription" subtitle="Inscrivez-vous à des événements" />
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
  count: { fontSize: FontSize.label, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginTop: Spacing.xs },
  list: { padding: Spacing.xl, paddingBottom: 120, gap: Spacing.md },
  card: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.level1 },
  cardLeft: { padding: Spacing.md },
  dateBox: { width: 56, height: 64, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  dateDay: { fontSize: FontSize.title, fontWeight: FontWeight.bold },
  dateMonth: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  cardBody: { flex: 1, paddingVertical: Spacing.md, paddingRight: Spacing.md, gap: Spacing.xs },
  cardTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  confirmedBadge: { backgroundColor: Colors.successBg },
  pastBadge: { backgroundColor: Colors.borderLight },
  statusTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  confirmedTxt: { color: Colors.success },
  pastTxt: { color: Colors.textSecondary },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cancelTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.error },
});
