import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getEventById, Event } from '../../database/events';
import { useAuth } from '../../contexts/AuthContext';
import { isFavorite, addFavorite, removeFavorite } from '../../database/favorites';
import { getRegistrationByEventAndUser, registerForEvent, cancelRegistration } from '../../database/registrations';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { generateUUID as uuidv4 } from '../../utils/uuid';
import { Badge, Button } from '../../components/ui';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<Event | null>(null);
  const [fav, setFav] = useState(false);
  const [registered, setRegistered] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    const e = getEventById(id);
    setEvent(e);
    if (e && user) {
      setFav(isFavorite(e.id, user.email));
      setRegistered(!!getRegistrationByEventAndUser(e.id, user.email));
    }
  }, [id, user]));

  if (!event) return <View style={styles.container}><Text style={styles.loading}>Chargement...</Text></View>;

  const isPast = new Date(event.startDateTime) < new Date();
  const isFull = event.capacity ? event.registeredCount >= event.capacity : false;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  function toggleFav() {
    if (!user || !event) return;
    if (fav) removeFavorite(event.id, user.email);
    else addFavorite(event.id, user.email);
    setFav(!fav);
  }

  function handleRegister() {
    if (!user || !event) return;
    if (registered) {
      Alert.alert('Annuler', 'Annuler votre inscription ?', [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui', style: 'destructive', onPress: () => {
          cancelRegistration(event.id, user.email);
          setRegistered(false);
          setEvent({ ...event, registeredCount: Math.max(0, event.registeredCount - 1) });
        }},
      ]);
    } else {
      registerForEvent(uuidv4(), event.id, user.email);
      setRegistered(true);
      setEvent({ ...event, registeredCount: event.registeredCount + 1 });
      Alert.alert('Inscrit !', 'Vous êtes inscrit.');
    }
  }

  const btnLabel = registered ? 'Annuler l\'inscription' : isPast ? 'Événement passé' : isFull ? 'Complet' : 'Réserver ma place';

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBtn} onPress={toggleFav}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? Colors.error : Colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: event.imageUrl || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80' }} style={styles.image} />
        </View>

        <View style={styles.content}>
          <Badge label={event.category} variant="category" />
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.organizer}>par {event.organizerName}</Text>

          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.metaText}>{fmtDate(event.startDateTime)} — {fmtTime(event.startDateTime)}{event.endDateTime ? ` - ${fmtTime(event.endDateTime)}` : ''}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.metaText}>{event.locationName}{event.locationAddress ? `, ${event.locationAddress}` : ''}</Text>
            </View>
          </View>

          {event.capacity && (
            <View style={styles.capBox}>
              <View style={styles.capHeader}><Text style={styles.capLabel}>Places</Text><Text style={styles.capValue}>{event.registeredCount}/{event.capacity}</Text></View>
              <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }]} /></View>
            </View>
          )}

          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.description}>{event.description}</Text>

          {event.tags && event.tags.length > 0 && (
            <View style={styles.tagsWrap}>
              {event.tags.map((t, i) => <View key={i} style={styles.tag}><Text style={styles.tagTxt}>{t}</Text></View>)}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <Button title={btnLabel} onPress={handleRegister}
          variant={registered ? 'danger' : 'primary'} size="lg"
          disabled={!registered && (isPast || isFull)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { textAlign: 'center', marginTop: 100, fontSize: FontSize.body, color: Colors.textSecondary },
  scrollContent: { paddingBottom: Spacing.xl },
  topBar: { position: 'absolute', left: Spacing.md, right: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  topBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  imageWrap: { height: 280 },
  image: { width: '100%', height: '100%' },
  content: { padding: Spacing.xl },
  title: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 32, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  organizer: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Spacing.xl },
  metaBox: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, marginBottom: Spacing.xl },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  metaText: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary, flex: 1 },
  capBox: { marginBottom: Spacing.xl },
  capHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  capLabel: { fontSize: FontSize.label, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  capValue: { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: Colors.borderLight, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  sectionTitle: { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  description: { fontSize: FontSize.body, fontWeight: FontWeight.regular, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.xl },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  tag: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.sm },
  tagTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  bottomBar: { padding: Spacing.lg, paddingTop: Spacing.lg, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
});
