import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createEvent } from '../../database/events';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { generateUUID as uuidv4 } from '../../utils/uuid';
import { TextField, Chip, Button, Header, Screen } from '../../components/ui';

const CATEGORIES = ['Talk', 'Workshop', 'Club', 'Exam', 'Other'] as const;

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Le titre est requis';
    if (!description.trim()) e.description = 'La description est requise';
    if (!date.trim()) e.date = 'La date est requise';
    if (!time.trim()) e.time = 'L\'heure est requise';
    if (!location.trim()) e.location = 'Le lieu est requis';
    if (capacity && (isNaN(Number(capacity)) || Number(capacity) <= 0)) e.capacity = 'Doit être un entier positif';
    if (endDate && endTime) {
      if (new Date(`${endDate}T${endTime}`) <= new Date(`${date}T${time}`)) e.endDate = 'Doit être après le début';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    createEvent({
      id: uuidv4(),
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
    Alert.alert('Succès', 'Événement créé !', [{ text: 'OK', onPress: () => router.back() }]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Création" onBack={() => router.back()} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TextField label="TITRE DE L'ÉVÉNEMENT" placeholder="Ex: Hackathon Web3" value={title} onChangeText={setTitle} error={errors.title} />
        <TextField label="DESCRIPTION" placeholder="Détails du programme..." value={description} onChangeText={setDescription} multiline numberOfLines={4} style={styles.textarea} error={errors.description} />

        <View style={styles.field}>
          <View style={styles.chips}>
            {CATEGORIES.map(c => (
              <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <TextField label="DATE DE DÉBUT" placeholder="AAAA-MM-JJ" value={date} onChangeText={setDate} error={errors.date} style={{ flex: 1 }} />
          <TextField label="HEURE" placeholder="HH:MM" value={time} onChangeText={setTime} error={errors.time} style={{ flex: 1 }} />
        </View>

        <View style={styles.row}>
          <TextField label="DATE DE FIN (OPT.)" placeholder="AAAA-MM-JJ" value={endDate} onChangeText={setEndDate} error={errors.endDate} style={{ flex: 1 }} />
          <TextField label="HEURE FIN" placeholder="HH:MM" value={endTime} onChangeText={setEndTime} style={{ flex: 1 }} />
        </View>

        <TextField label="LIEU" placeholder="Amphi A, Salle 301..." value={location} onChangeText={setLocation} error={errors.location} />
        <TextField label="ADRESSE (OPTIONNEL)" placeholder="Campus Sud, Bâtiment B" value={locationAddress} onChangeText={setLocationAddress} />
        <TextField label="ORGANISATEUR" placeholder="Dr. Sarah L." value={organizer} onChangeText={setOrganizer} />
        <TextField label="CAPACITÉ (OPTIONNEL)" placeholder="50" value={capacity} onChangeText={setCapacity} keyboardType="numeric" error={errors.capacity} />
        <TextField label="IMAGE URL (OPTIONNEL)" placeholder="https://exemple.com/image.jpg" value={imageUrl} onChangeText={setImageUrl} />
        <TextField label="TAGS (SÉPARÉS PAR VIRGULE)" placeholder="IA, Python, Workshop" value={tags} onChangeText={setTags} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
        <Button title="Publier" onPress={handleSubmit} size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: 40 },
  textarea: { height: 120, paddingTop: Spacing.lg, textAlignVertical: 'top' },
  field: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md },
  bottomBar: { padding: Spacing.xl, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
});
