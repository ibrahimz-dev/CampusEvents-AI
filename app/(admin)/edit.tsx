import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getEventById, updateEvent } from '../../database/events';
import { Colors, Spacing } from '../../constants/theme';
import { TextField, Chip, Button, Header } from '../../components/ui';

const CATEGORIES = ['Talk', 'Workshop', 'Club', 'Exam', 'Other'] as const;

export default function EditEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Workshop');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [capacity, setCapacity] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const event = getEventById(id);
    if (!event) { Alert.alert('Erreur', 'Événement introuvable'); router.back(); return; }
    setTitle(event.title);
    setDescription(event.description);
    setCategory(event.category);
    const start = new Date(event.startDateTime);
    setDate(start.toISOString().split('T')[0]);
    setTime(start.toTimeString().slice(0, 5));
    if (event.endDateTime) {
      const end = new Date(event.endDateTime);
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    }
    setLocation(event.locationName);
    setLocationAddress(event.locationAddress || '');
    setOrganizer(event.organizerName);
    setCapacity(event.capacity?.toString() || '');
    setTags(event.tags?.join(', ') || '');
    setImageUrl(event.imageUrl || '');
  }, [id]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Requis';
    if (!description.trim()) e.description = 'Requis';
    if (!date.trim()) e.date = 'Requis';
    if (!time.trim()) e.time = 'Requis';
    if (!location.trim()) e.location = 'Requis';
    if (capacity && (isNaN(Number(capacity)) || Number(capacity) <= 0)) e.capacity = 'Entier positif requis';
    if (endDate && endTime && new Date(`${endDate}T${endTime}`) <= new Date(`${date}T${time}`)) e.endDate = 'Doit être après le début';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate() || !id) return;
    updateEvent({
      id,
      title: title.trim(),
      description: description.trim(),
      category: category as any,
      startDateTime: new Date(`${date}T${time}`).toISOString(),
      endDateTime: endDate && endTime ? new Date(`${endDate}T${endTime}`).toISOString() : undefined,
      locationName: location.trim(),
      locationAddress: locationAddress.trim() || undefined,
      organizerName: organizer.trim() || 'Organisateur',
      capacity: capacity ? Number(capacity) : undefined,
      imageUrl: imageUrl.trim() || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    Alert.alert('Succès', 'Événement modifié !', [{ text: 'OK', onPress: () => router.back() }]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Modifier" onBack={() => router.back()} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TextField label="TITRE" value={title} onChangeText={setTitle} error={errors.title} />
        <TextField label="DESCRIPTION" value={description} onChangeText={setDescription} multiline numberOfLines={4} style={styles.textarea} error={errors.description} />

        <View style={styles.chips}>
          {CATEGORIES.map(c => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <View style={styles.row}>
          <TextField label="DATE DÉBUT" placeholder="AAAA-MM-JJ" value={date} onChangeText={setDate} error={errors.date} style={{ flex: 1 }} />
          <TextField label="HEURE" placeholder="HH:MM" value={time} onChangeText={setTime} error={errors.time} style={{ flex: 1 }} />
        </View>
        <View style={styles.row}>
          <TextField label="DATE FIN" placeholder="AAAA-MM-JJ" value={endDate} onChangeText={setEndDate} error={errors.endDate} style={{ flex: 1 }} />
          <TextField label="HEURE FIN" placeholder="HH:MM" value={endTime} onChangeText={setEndTime} style={{ flex: 1 }} />
        </View>

        <TextField label="LIEU" value={location} onChangeText={setLocation} error={errors.location} />
        <TextField label="ADRESSE (OPT.)" value={locationAddress} onChangeText={setLocationAddress} />
        <TextField label="ORGANISATEUR" value={organizer} onChangeText={setOrganizer} />
        <TextField label="CAPACITÉ (OPT.)" value={capacity} onChangeText={setCapacity} keyboardType="numeric" error={errors.capacity} />
        <TextField label="IMAGE URL (OPT.)" placeholder="https://..." value={imageUrl} onChangeText={setImageUrl} />
        <TextField label="TAGS" placeholder="IA, Python..." value={tags} onChangeText={setTags} />
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
        <Button title="Enregistrer" onPress={handleSubmit} size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: 40 },
  textarea: { height: 120, paddingTop: Spacing.lg, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md },
  bottom: { padding: Spacing.xl, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
});
