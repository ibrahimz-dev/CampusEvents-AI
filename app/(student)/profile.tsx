import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Shadow, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => { logout(); router.replace('/'); } },
    ]);
  }

  function handleSaveName() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      updateUser({ name: trimmed });
    }
    setEditingName(false);
  }

  function handleCancelEdit() {
    setNameInput(user?.name || '');
    setEditingName(false);
  }

  const displayName = user?.name || (user?.role === 'admin' ? 'Administrateur' : 'Étudiant');

  const menuItems = [
    { icon: 'person-outline', label: 'Mon Profil', subtitle: user?.email || '' },
    { icon: 'shield-checkmark-outline', label: 'Sécurité', subtitle: 'Données locales uniquement' },
    { icon: 'information-circle-outline', label: 'À propos', subtitle: 'CampusEvents AI v1.0' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <Text style={styles.headerLabel}>MON</Text>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color={Colors.textWhite} />
          </View>
          {editingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Entrez votre nom"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancelEdit} style={styles.editActionBtn}>
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveName} style={styles.editActionBtn}>
                  <Ionicons name="checkmark" size={20} color={Colors.success} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              <TouchableOpacity onPress={() => setEditingName(true)} style={styles.editButton}>
                <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'admin' ? 'Admin' : 'Étudiant'}
            </Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <View key={i} style={styles.menuItem}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button
          title="Se déconnecter"
          onPress={handleLogout}
          variant="danger"
          size="lg"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.textSecondary, letterSpacing: 2, marginBottom: Spacing.xs },
  headerTitle: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  content: { padding: Spacing.xl, paddingBottom: 120 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  userName: { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  userEmail: { fontSize: FontSize.label, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Spacing.md },
  avatarCircle: { width: 80, height: 80, borderRadius: BorderRadius.xl, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadow.level1, borderWidth: 2, borderColor: Colors.surface, transform: [{ rotate: '3deg' }] },
  roleBadge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, backgroundColor: Colors.borderLight },
  roleText: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  editButton: { width: 32, height: 32, borderRadius: BorderRadius.full, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  editNameContainer: { alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xs, width: '100%' },
  nameInput: { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingVertical: Spacing.xs, minWidth: 200 },
  editActions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  editActionBtn: { width: 36, height: 36, borderRadius: BorderRadius.full, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  menuSection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.level1, marginBottom: Spacing.xl },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  menuTextWrap: { flex: 1 },
  menuLabel: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  menuSub: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginTop: Spacing.xs },
});
