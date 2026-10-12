import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getAllEvents, getUpcomingEvents } from '../../database/events';
import { getFavoritesByUser } from '../../database/favorites';
import { getRegistrationsByUser } from '../../database/registrations';
import { getEventById } from '../../database/events';
import { saveLLMResult, getCachedLLMResult } from '../../database/llmResults';
import { searchEventsNL, getRecommendations, planSchedule, askCatalogQuestion, getApiKey } from '../../services/llm';
import { Colors, Shadow, BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { generateUUID as uuidv4 } from '../../utils/uuid';

type Message = { id: string; role: 'user' | 'ai' | 'system'; text: string; type?: string; errorPayload?: { mode: AIMode; text: string } };
type AIMode = 'search' | 'recommendation' | 'planning' | 'qa';

const QUICK_ACTIONS = [
  { label: 'Recherche', mode: 'search' as AIMode, icon: 'search' },
  { label: 'Recommandations', mode: 'recommendation' as AIMode, icon: 'star' },
  { label: 'Planning', mode: 'planning' as AIMode, icon: 'calendar' },
  { label: 'Question', mode: 'qa' as AIMode, icon: 'chatbubble' },
];

export default function AssistantScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'Salut ! Je suis ton assistant Campus AI. Choisis un mode ci-dessous pour commencer.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>('search');
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  async function executeRequest(text: string, mode: AIMode) {
    const cached = getCachedLLMResult(user!.email, mode, text);
    if (cached) { addMessage({ id: uuidv4(), role: 'ai', text: cached.outputText, type: mode }); return; }

    let response = '';
    const allEvents = getAllEvents();
    const upcoming = getUpcomingEvents();

    switch (mode) {
      case 'search': response = await searchEventsNL(text, allEvents); break;
      case 'recommendation': {
        const favs = getFavoritesByUser(user!.email).map(f => { const e = getEventById(f.eventId); return e ? { title: e.title, category: e.category, tags: e.tags } : null; }).filter(Boolean) as any[];
        const regs = getRegistrationsByUser(user!.email).map(r => { const e = getEventById(r.eventId); return e ? { title: e.title, category: e.category, tags: e.tags } : null; }).filter(Boolean) as any[];
        response = await getRecommendations(upcoming, favs, regs); break;
      }
      case 'planning': response = await planSchedule(text, upcoming); break;
      case 'qa': response = await askCatalogQuestion(text, allEvents); break;
    }

    saveLLMResult({ id: uuidv4(), userId: user!.email, type: mode, inputText: text, outputText: response, createdAt: new Date().toISOString() });
    addMessage({ id: uuidv4(), role: 'ai', text: response, type: mode });
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !user) return;
    setInput('');
    addMessage({ id: uuidv4(), role: 'user', text, type: currentMode });
    setLoading(true);
    try { await executeRequest(text, currentMode); }
    catch (error: any) { addMessage({ id: uuidv4(), role: 'system', text: `Erreur : ${error.message || 'Erreur lors de la requête IA'}`, errorPayload: { mode: currentMode, text } }); }
    finally { setLoading(false); }
  }

  async function handleRetry(msg: Message) {
    if (!msg.errorPayload || !user) return;
    addMessage({ id: uuidv4(), role: 'system', text: 'Nouvelle tentative...' });
    setLoading(true);
    try { await executeRequest(msg.errorPayload.text, msg.errorPayload.mode); }
    catch (error: any) { addMessage({ id: uuidv4(), role: 'system', text: `Erreur : ${error.message || 'Erreur'}`, errorPayload: msg.errorPayload }); }
    finally { setLoading(false); }
  }

  async function handleQuickAction(mode: AIMode) {
    setCurrentMode(mode);
    if (mode !== 'recommendation') return;
    if (loading || !user) return;
    const text = 'Recommande-moi des événements';
    addMessage({ id: uuidv4(), role: 'user', text, type: 'recommendation' });
    setLoading(true);
    try {
      const cached = getCachedLLMResult(user.email, 'recommendation', text);
      if (cached) { addMessage({ id: uuidv4(), role: 'ai', text: cached.outputText, type: 'recommendation' }); setLoading(false); return; }
      const upcoming = getUpcomingEvents();
      const favs = getFavoritesByUser(user.email).map(f => { const e = getEventById(f.eventId); return e ? { title: e.title, category: e.category, tags: e.tags } : null; }).filter(Boolean) as any[];
      const regs = getRegistrationsByUser(user.email).map(r => { const e = getEventById(r.eventId); return e ? { title: e.title, category: e.category, tags: e.tags } : null; }).filter(Boolean) as any[];
      const response = await getRecommendations(upcoming, favs, regs);
      saveLLMResult({ id: uuidv4(), userId: user.email, type: 'recommendation', inputText: text, outputText: response, createdAt: new Date().toISOString() });
      addMessage({ id: uuidv4(), role: 'ai', text: response, type: 'recommendation' });
    } catch (error: any) { addMessage({ id: uuidv4(), role: 'system', text: `Erreur : ${error.message || 'Erreur'}`, errorPayload: { mode: 'recommendation' as AIMode, text } }); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <View style={{ width: 48 }} />
        <View style={styles.headerCenter}>
          <View style={styles.aiIcon}><Ionicons name="flash" size={20} color={Colors.primary} /></View>
          <Text style={styles.headerTitle}>Campus AI</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.modeBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.mode}
              style={[styles.modeChip, currentMode === a.mode && styles.modeActive]}
              onPress={() => handleQuickAction(a.mode)}
              disabled={loading}
            >
              <Ionicons name={a.icon as any} size={14} color={currentMode === a.mode ? Colors.textWhite : Colors.textSecondary} style={{ marginRight: Spacing.xs }} />
              <Text style={[styles.modeTxt, currentMode === a.mode && styles.modeTxtA]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.msgContent} showsVerticalScrollIndicator={false}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.msgRow, msg.role === 'user' && styles.msgRowRight]}>
            <View style={[styles.bubble, msg.role === 'user' && styles.bubbleUser, msg.role === 'system' && styles.bubbleSystem]}>
              <Text style={[styles.bubbleTxt, msg.role === 'user' && styles.bubbleTxtUser, msg.role === 'system' && styles.bubbleTxtSystem]} selectable>
                {msg.text}
              </Text>
              {msg.role === 'system' && msg.errorPayload && (
                <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetry(msg)} disabled={loading}>
                  <Ionicons name="refresh" size={14} color={Colors.warning} />
                  <Text style={styles.retryTxt}>Réessayer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.msgRow}>
            <View style={[styles.bubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingTxt}>Analyse en cours...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom + Spacing.sm, Spacing.md) }]}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={currentMode === 'search' ? 'Rechercher un événement...' : currentMode === 'planning' ? 'Décris tes contraintes...' : currentMode === 'qa' ? 'Pose une question...' : 'Demander à l\'IA...'}
            placeholderTextColor={Colors.textMuted}
            multiline
            editable={!loading}
          />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]} onPress={handleSend} disabled={!input.trim() || loading}>
            <Ionicons name="send" size={18} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.subhead, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  modeBar: { paddingVertical: Spacing.sm },
  modeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  modeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  modeTxtA: { color: Colors.textWhite, fontWeight: FontWeight.semibold },
  messages: { flex: 1 },
  msgContent: { padding: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.lg },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  bubble: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderTopLeftRadius: BorderRadius.sm, padding: Spacing.lg, maxWidth: '88%', borderWidth: 1, borderColor: Colors.border, ...Shadow.level1 },
  bubbleUser: { backgroundColor: Colors.primary, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.sm, borderColor: Colors.primary },
  bubbleSystem: { backgroundColor: Colors.warningBg, borderColor: 'rgba(255,159,10,0.2)', borderTopLeftRadius: BorderRadius.lg },
  bubbleTxt: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTxtUser: { color: Colors.textWhite },
  bubbleTxtSystem: { color: Colors.textPrimary },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  loadingTxt: { fontSize: FontSize.label, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,159,10,0.3)' },
  retryTxt: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.warning },
  inputBar: { padding: Spacing.md, paddingTop: Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.borderLight, borderRadius: BorderRadius.md, padding: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary, paddingHorizontal: Spacing.md, maxHeight: 80 },
  sendBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
});
