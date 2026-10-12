import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('campusevents.db');
  }
  return db;
}

export function initDatabase() {
  const database = getDatabase();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      startDateTime TEXT NOT NULL,
      endDateTime TEXT,
      locationName TEXT NOT NULL,
      locationAddress TEXT,
      organizerName TEXT NOT NULL,
      capacity INTEGER,
      registeredCount INTEGER DEFAULT 0,
      imageUrl TEXT,
      tags TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (eventId, userId),
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS llm_results (
      id TEXT PRIMARY KEY,
      eventId TEXT,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      inputText TEXT NOT NULL,
      outputText TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // Enable foreign keys
  database.execSync('PRAGMA foreign_keys = ON;');

  // Seed sample events if empty
  const count = database.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM events');
  if (count && count.count === 0) {
    seedSampleEvents(database);
  }
}

function seedSampleEvents(database: SQLite.SQLiteDatabase) {
  const now = new Date();

  const sampleEvents = [
    {
      id: 'evt-001',
      title: 'Machine Learning 101',
      description: 'Découvrez les concepts fondamentaux du Machine Learning dans ce workshop pratique. Plongez dans l\'univers de l\'IA avec Python et TensorFlow. Apprenez à construire vos premiers modèles de classification et de régression.',
      category: 'Workshop',
      startDateTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      locationName: 'Amphi A',
      locationAddress: 'Campus Sud, Bâtiment Principal',
      organizerName: 'Dr. Sarah Lamrani',
      capacity: 50,
      registeredCount: 12,
      imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80',
      tags: '["IA","Python","Machine Learning","Data Science"]',
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-002',
      title: 'Hackathon Web3 & Blockchain',
      description: 'Un hackathon de 24h dédié aux technologies Web3 et blockchain. Formez une équipe de 3-5 personnes et développez une dApp innovante. Des mentors experts vous guideront tout au long de l\'événement.',
      category: 'Workshop',
      startDateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      locationName: 'Labo Innovation',
      locationAddress: 'Campus Nord, Bâtiment Tech',
      organizerName: 'Club Blockchain',
      capacity: 100,
      registeredCount: 45,
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
      tags: '["Blockchain","Web3","Hackathon","dApp"]',
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-003',
      title: 'Conférence: L\'avenir de l\'IA',
      description: 'Un talk inspirant sur les dernières avancées en intelligence artificielle et leur impact sur la société. Le Dr. Benali, chercheur en IA, partagera ses travaux récents sur les modèles de langage.',
      category: 'Talk',
      startDateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      locationName: 'Salle de Conférences',
      locationAddress: 'Campus Central',
      organizerName: 'Dr. Karim Benali',
      capacity: 200,
      registeredCount: 78,
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
      tags: '["IA","Conférence","Recherche","LLM"]',
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-004',
      title: 'Club Robotique - Session Ouverte',
      description: 'Venez découvrir le club de robotique ! Session portes ouvertes avec démonstration de nos projets en cours : drone autonome, bras robotisé et robot suiveur de ligne.',
      category: 'Club',
      startDateTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      locationName: 'Atelier Mécatronique',
      locationAddress: 'Campus Sud, Bâtiment B2',
      organizerName: 'Club Robotique ENSEM',
      capacity: 30,
      registeredCount: 22,
      imageUrl: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800&q=80',
      tags: '["Robotique","Arduino","Électronique","Club"]',
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-005',
      title: 'Préparation aux entretiens Tech',
      description: 'Workshop de préparation aux entretiens techniques pour les stages et emplois en entreprise tech. Algorithmes, structures de données, et mise en situation avec des recruteurs partenaires.',
      category: 'Workshop',
      startDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      locationName: 'Salle 301',
      locationAddress: 'Campus Central, Bâtiment A',
      organizerName: 'Career Center',
      capacity: 40,
      registeredCount: 35,
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
      tags: '["Carrière","Entretien","Algorithmes","Stage"]',
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-006',
      title: 'Data Science avec R',
      description: 'Introduction pratique à la data science avec le langage R. Visualisation de données, statistiques descriptives et premiers modèles prédictifs. Apportez votre laptop !',
      category: 'Workshop',
      startDateTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      locationName: 'Salle Informatique B',
      locationAddress: 'Campus Nord',
      organizerName: 'Prof. Amina Kaddouri',
      capacity: 25,
      registeredCount: 18,
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      tags: '["Data Science","R","Statistiques","Visualisation"]',
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-007',
      title: 'Examen Partiel - Algèbre Linéaire',
      description: 'Examen partiel du module d\'algèbre linéaire. Durée : 2h. Documents autorisés : une feuille A4 recto-verso manuscrite. Calculatrices non programmables autorisées.',
      category: 'Exam',
      startDateTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      locationName: 'Amphi Grand',
      locationAddress: 'Campus Central',
      organizerName: 'Département Mathématiques',
      capacity: 300,
      registeredCount: 0,
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
      tags: '["Examen","Mathématiques","Algèbre"]',
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-008',
      title: 'Soirée Networking Tech',
      description: 'Soirée networking avec des professionnels du secteur tech. Rencontrez des ingénieurs de Google, Microsoft et des startups locales. Buffet et boissons offerts.',
      category: 'Other',
      startDateTime: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      locationName: 'Espace Événementiel',
      locationAddress: 'Campus Central, Hall Principal',
      organizerName: 'Bureau des Étudiants',
      capacity: 150,
      registeredCount: 89,
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
      tags: '["Networking","Carrière","Tech","Social"]',
      createdAt: now.toISOString(),
    },
  ];

  for (const event of sampleEvents) {
    database.runSync(
      `INSERT OR IGNORE INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.title,
        event.description,
        event.category,
        event.startDateTime,
        event.endDateTime,
        event.locationName,
        event.locationAddress,
        event.organizerName,
        event.capacity,
        event.registeredCount,
        event.imageUrl,
        event.tags,
        event.createdAt,
      ]
    );
  }
}
