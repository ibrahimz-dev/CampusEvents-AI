import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Event } from '../database/events';

const SECURE_STORE_KEY = 'llm_api_key';

function getConfig() {
  const extra = Constants.expoConfig?.extra || {};
  return {
    apiKey: extra.LLM_API_KEY || process.env.EXPO_PUBLIC_LLM_API_KEY || '',
    provider: extra.LLM_PROVIDER || process.env.EXPO_PUBLIC_LLM_PROVIDER || 'groq',
    model: extra.LLM_MODEL || process.env.EXPO_PUBLIC_LLM_MODEL || 'llama-3.3-70b-versatile',
  };
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_KEY, key);
}

export async function getApiKey(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (stored) return stored;
  } catch {}
  return getConfig().apiKey;
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
}

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const config = getConfig();
  const apiKey = await getApiKey();

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('Clé API non configurée. Veuillez saisir votre clé API dans les paramètres de l\'assistant.');
  }

  let url = '';
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  let body: any = {};

  switch (config.provider) {
    case 'groq':
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      body = {
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      };
      break;
    case 'openai':
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      body = {
        model: config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      };
      break;
    case 'mistral':
      url = 'https://api.mistral.ai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      body = {
        model: config.model || 'mistral-small-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      };
      break;
    default:
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      body = {
        model: config.model || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error('Clé API invalide. Vérifiez votre configuration.');
    }
    if (response.status === 429) {
      throw new Error('Limite de requêtes atteinte. Réessayez dans quelques instants.');
    }
    throw new Error(`Erreur API (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Aucune réponse générée.';
}

function serializeEventsForLLM(events: Event[], maxChars: number = 6000): string {
  const simplified = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description.substring(0, 150),
    category: e.category,
    startDateTime: e.startDateTime,
    endDateTime: e.endDateTime,
    location: e.locationName,
    organizer: e.organizerName,
    capacity: e.capacity,
    registered: e.registeredCount,
    placesLeft: e.capacity ? e.capacity - e.registeredCount : 'illimité',
    tags: e.tags,
  }));

  let json = JSON.stringify(simplified, null, 0);
  if (json.length > maxChars) {
    const ratio = maxChars / json.length;
    const reduced = simplified.slice(0, Math.floor(simplified.length * ratio));
    json = JSON.stringify(reduced, null, 0);
  }
  return json;
}

export async function searchEventsNL(query: string, events: Event[]): Promise<string> {
  const systemPrompt = `Tu es un assistant intelligent du campus universitaire. Tu aides les étudiants à trouver des événements pertinents.

RÔLE: Analyser le catalogue d'événements et identifier ceux qui correspondent à la requête de l'étudiant, même sans correspondance exacte de mots-clés.

CATALOGUE D'ÉVÉNEMENTS (JSON):
${serializeEventsForLLM(events)}

INSTRUCTIONS:
1. Analyse la requête de l'étudiant et identifie l'intention
2. Cherche des correspondances sémantiques, pas seulement des mots-clés exacts
3. Pour chaque événement pertinent, fournis une justification courte
4. Trie par pertinence décroissante
5. Si aucun événement ne correspond, dis-le clairement

FORMAT DE RÉPONSE (texte structuré):
Pour chaque événement trouvé:
🎯 **[Titre de l'événement]**
📅 [Date et heure]
📍 [Lieu]
💡 *Pourquoi cet événement:* [justification courte]

Si aucun résultat: explique pourquoi et suggère des alternatives.`;

  const userMessage = `Recherche: "${query}"`;
  return callLLM(systemPrompt, userMessage);
}

export async function getRecommendations(
  events: Event[],
  favorites: { title: string; category: string; tags?: string[] }[],
  registrations: { title: string; category: string; tags?: string[] }[]
): Promise<string> {
  const systemPrompt = `Tu es un assistant de recommandation du campus. Tu analyses les préférences de l'étudiant pour suggérer des événements pertinents.

RÔLE: Recommander exactement 3 événements à venir que l'étudiant n'a pas encore découverts, basés sur ses goûts.

HISTORIQUE DE L'ÉTUDIANT:
- Favoris: ${JSON.stringify(favorites)}
- Inscriptions: ${JSON.stringify(registrations)}

ÉVÉNEMENTS DISPONIBLES (à venir uniquement):
${serializeEventsForLLM(events)}

INSTRUCTIONS:
1. Analyse les patterns dans les favoris et inscriptions (catégories, tags, sujets)
2. Sélectionne 3 événements à venir qui correspondent au profil
3. Ne recommande PAS les événements déjà en favoris ou inscrits
4. Justifie chaque recommandation par rapport au profil
5. Si le profil est vide, recommande les événements les plus populaires

FORMAT DE RÉPONSE (texte structuré):
Pour chaque recommandation (exactement 3):
⭐ **[Titre]**
📅 [Date] | 📍 [Lieu]
🎯 *Correspondance:* [pourquoi cet événement matche ton profil]
👥 [Places disponibles]`;

  return callLLM(systemPrompt, 'Donne-moi des recommandations personnalisées.');
}

export async function planSchedule(
  constraints: string,
  events: Event[]
): Promise<string> {
  const systemPrompt = `Tu es un assistant de planification du campus. Tu aides l'étudiant à organiser sa semaine en tenant compte de ses contraintes.

RÔLE: Créer un planning de participation aux événements sans conflits horaires.

ÉVÉNEMENTS DE LA SEMAINE:
${serializeEventsForLLM(events)}

INSTRUCTIONS:
1. Analyse les contraintes horaires de l'étudiant
2. Identifie les événements compatibles avec son emploi du temps
3. Propose un planning sans conflits
4. Signale les éventuels conflits détectés
5. Suggère des priorités si trop d'événements sont disponibles

FORMAT DE RÉPONSE (texte structuré):
📋 **Planning proposé:**

Pour chaque jour:
**[Jour]**
⏰ [Horaire] → **[Événement]** @ [Lieu]
   💡 [Note/raison]

⚠️ **Conflits détectés:** [liste ou "aucun"]
💡 **Conseils:** [suggestions d'optimisation]`;

  const userMessage = `Mes contraintes: "${constraints}"`;
  return callLLM(systemPrompt, userMessage);
}

export async function askCatalogQuestion(question: string, events: Event[]): Promise<string> {
  const systemPrompt = `Tu es un assistant expert du catalogue d'événements du campus universitaire. Tu réponds aux questions transversales sur l'ensemble des événements.

RÔLE: Répondre de manière précise et utile aux questions sur les événements du campus.

CATALOGUE COMPLET:
${serializeEventsForLLM(events)}

INSTRUCTIONS:
1. Analyse la question et identifie les informations pertinentes
2. Réponds de manière structurée et complète
3. Cite les événements spécifiques quand c'est pertinent
4. Si la réponse nécessite un calcul (nombre d'événements, places disponibles...), fais-le
5. Sois honnête si l'information n'est pas dans le catalogue

FORMAT DE RÉPONSE:
Réponds de manière naturelle et structurée. Utilise des emoji pour la lisibilité.
Cite les événements pertinents avec leurs dates et lieux.`;

  const userMessage = `Question: "${question}"`;
  return callLLM(systemPrompt, userMessage);
}
