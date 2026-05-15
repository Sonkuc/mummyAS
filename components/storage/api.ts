// API functions for backend integration using fetch
// Assumes backend is running on http://localhost:8000 (adjust if needed, e.g., for mobile use your machine's IP)

import { BreastfeedingRecord, BreastfeedingSyncDay, Child, ChildUpdate, Diary, DiaryCreate, DiaryUpdate, FoodRecord, FoodRecordCreate, Milestone, SleepRecord, SleepSyncDay, TeethRecord, WeightHeight, Word, WordEntry, WordUpdatePayload } from "./interfaces";

const BASE_URL = 'http://192.168.31.152:8000'; // Change to your backend URL for mobile testing

// ============ USER API FUNCTIONS ============

export const ensureUserProfile = async (userId: string, email: string, gender: string = "not_set") => {
  const payload = { id: userId, email, gender };

  try {
    const response = await fetch(`${BASE_URL}/profiles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': userId  // Nutné pro validaci v routeru
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error("Failed to ensure profile", await response.text());
    }
    return await response.json();
  } catch (err) {
    console.error("Network Error:", err);
  }
};

export const deleteUserProfile = async (userId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/profiles/${userId}`, {
    method: 'DELETE',
    headers: { 
      'X-User-Id': userId 
    },
  });
  if (!response.ok) throw new Error('Nepodařilo se smazat data z backendu');
};

// ============ CHILD API FUNCTIONS ============

export const fetchChildren = async (userId: string): Promise<Child[]> => {
  const response = await fetch(`${BASE_URL}/children`, {
    headers: { 'X-User-Id': userId },
  });
  if (!response.ok) throw new Error('Failed to fetch children');
  return response.json();
};

export const createChild = async (childData: any, userId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/children`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-User-Id': userId
    },
    body: JSON.stringify(childData), 
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[API ERROR] CreateChild:`, errorData);
    throw new Error('Failed to create child');
  }
  return response.json();
};

export const fetchChild = async (childId: string, userId: string): Promise<Child> => {
  const response = await fetch(`${BASE_URL}/children/${childId}`, {
    headers: { 'X-User-Id': userId },
  });
  if (!response.ok) throw new Error('Failed to fetch child');
  return response.json();
};

export const updateChild = async (childId: string, childData: ChildUpdate, userId: string): Promise<Child> => {
  // Připravíme payload, který přesně odpovídá Python modelu ChildUpdate
  const payload: any = {
    name: childData.name,
    birthDate: childData.birthDate,
    sex: childData.sex,
    photo: childData.photo,
  };

  if ('currentModeFeed' in childData) payload.currentModeFeed = childData.currentModeFeed;
  if ('currentModeSleep' in childData) payload.currentModeSleep = childData.currentModeSleep;

  const response = await fetch(`${BASE_URL}/children/${childId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-User-Id': userId
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Sync failed: ${errorMsg}`);
  }
  return response.json();
};

export const deleteChild = async (childId: string, userId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/children/${childId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
  if (!response.ok) throw new Error('Failed to delete child');
};

// ============ MILESTONE API FUNCTIONS ============

// Vrací pole milníků pro konkrétní dítě
export const fetchMilestones = async (childId: string, userId: string): Promise<Milestone[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch milestones');
  return response.json() as Promise<Milestone[]>;
};

// Vytvoření milníku
export const createMilestone = async (
  childId: string, 
  milestoneData: Omit<Milestone, 'id' | 'child_id'>,
  userId: string
): Promise<Milestone> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify(milestoneData),
  });
  if (!response.ok) throw new Error('Failed to create milestone');
  return response.json() as Promise<Milestone>;
};

// Detail jednoho milníku
export const fetchMilestone = async (childId: string, milestoneId: string, userId: string): Promise<Milestone> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch milestone');
  return response.json() as Promise<Milestone>;
};

// Aktualizace milníku
export const updateMilestone = async (
  childId: string, 
  milestoneId: string, 
  milestoneData: Partial<Milestone>,
  userId: string
): Promise<Milestone> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify(milestoneData),
  });
  if (!response.ok) throw new Error('Failed to update milestone');
  return response.json() as Promise<Milestone>;
};

export const syncMilestones = async (childId: string, milestones: Milestone[], userId: string): Promise<Milestone[]> => {
  const syncedMilestones = [...milestones];
  for (let i = 0; i < syncedMilestones.length; i++) {
    const mil = syncedMilestones[i];
    try {
      const isLocal = mil.id.toString().startsWith("local-");
      if (isLocal) {
        // Nový milník z offline režimu
        syncedMilestones[i] = await createMilestone(childId, mil, userId);
      } else {
        // Pokus o update existujícího
        try {
          await updateMilestone(childId, mil.id.toString(), mil, userId);
        } catch (err: any) {
          // Pokud na serveru zmizel, znovu ho vytvoříme
          if (err.message.includes("404")) {
            syncedMilestones[i] = await createMilestone(childId, mil, userId);
          } else throw err;
        }
      }
    } catch (err) {
      console.error(`[SYNC-MILESTONE] Chyba u ${mil.id}:`, err);
    }
  }
  return syncedMilestones;
};

// Smazání milníku
export const deleteMilestone = async (childId: string, milestoneId: string, userId: string): Promise<Response> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to delete milestone');
  return response;
};

// ============ WEIGHT/HEIGHT API FUNCTIONS ============

// Získání všech záznamů
export const fetchWeightHeights = async (childId: string, userId: string): Promise<WeightHeight[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch weight/height records');
  return response.json();
};

export const syncWeightHeights = async (childId: string, records: WeightHeight[], userId: string): Promise<WeightHeight[]> => {
  const payload = records.map(rec => ({
    date: rec.date,
    weight: (rec.weight === "" || rec.weight == null) ? null : Number(String(rec.weight).replace(",", ".")),
    height: (rec.height === "" || rec.height == null) ? null : Number(String(rec.height).replace(",", ".")),
    head: (rec.head === "" || rec.head == null) ? null : Number(String(rec.head).replace(",", ".")),
    foot: rec.foot || null,
    clothes: rec.clothes || null
  }));

  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Sync WH failed');
  return response.json();
};

// ============ BREASTFEEDING API FUNCTIONS ============

export const fetchBreastfeedingRecords = async (childId: string, userId: string, date?: string): Promise<BreastfeedingRecord[]> => {
  const url = new URL(`${BASE_URL}/children/${childId}/breastfeeding`);
  if (date) url.searchParams.append('date', date);

  const response = await fetch(url.toString(), {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Nepodařilo se načíst záznamy kojení');
  return response.json();
};

export const updateBreastfeedingDay = async (
  childId: string, 
  date: string, 
  bfData: BreastfeedingSyncDay, // Pole objektů {time, state, note}
  userId: string
): Promise<BreastfeedingRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/day/${date}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json', 
      'X-User-Id': userId 
    },
    body: JSON.stringify(bfData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Chyba při synchronizaci dne kojení');
  }
  
  return response.json();
};

export const fetchBreastfeedingStats = async (childId: string, userId: string): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/stats`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Nepodařilo se načíst statistiky kojení');
  return response.json();
};

export const deleteBreastfeedingRecord = async (childId: string, bfId: string, userId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/${bfId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
  if (!response.ok) throw new Error('Nepodařilo se smazat záznam kojení');
};

export const fetchBreastfeedingRecord = async (childId: string, bfId: string, userId: string): Promise<BreastfeedingRecord> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/${bfId}`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Záznam kojení nebyl nalezen');
  return response.json();
};

// ============ SLEEP API FUNCTIONS ============

export const fetchSleepRecords = async (childId: string, userId: string, date?: string): Promise<SleepRecord[]> => {
  const url = new URL(`${BASE_URL}/children/${childId}/sleep`);
  if (date) url.searchParams.append('date', date);

  const response = await fetch(url.toString(), {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch sleep records');
  return response.json();
};

export const fetchSleepRecord = async (
  childId: string, 
  sleepId: string, 
  userId: string
): Promise<SleepRecord> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/${sleepId}`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch sleep record');
  return response.json() as Promise<SleepRecord>;
};

// Statistiky pro grafy
export const fetchSleepStats = async (childId: string, userId: string): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/stats`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch sleep stats');
  return response.json();
};

// Aktualizace celého dne
export const updateSleepDay = async (
  childId: string, 
  date: string, 
  sleepData: SleepSyncDay, 
  userId: string
): Promise<SleepRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/day/${date}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json', 
      'X-User-Id': userId 
    },
    body: JSON.stringify(sleepData),
  });
  if (!response.ok) throw new Error('Failed to update sleep day');
  return response.json() as Promise<SleepRecord[]>;
};

// ============ SPEAKING (WORD) API FUNCTIONS ============

export const fetchWords = async (child_id: string, userId: string): Promise<Word[]> => {
  const response = await fetch(`${BASE_URL}/children/${child_id}/words`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch words');
  return response.json();
};

export const createWord = async (childId: string, data: { name: string; entries: Omit<WordEntry, 'id'>[] }, userId: string): Promise<Word> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create word');
  return response.json();
};

export const updateWord = async (childId: string, wordId: string, data: { name: string; entries: Omit<WordEntry, 'id'>[] }, userId: string): Promise<Word> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words/${wordId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update word');
  return response.json();
};

// SYNCHRONIZACE (Offline-first logika)
export const syncWords = async (childId: string, words: Word[], userId: string): Promise<Word[]> => {
  const syncedWords = [...words];
  for (let i = 0; i < syncedWords.length; i++) {
    const word = syncedWords[i];
    
    // Příprava dat pro backend (očištění od systémových polí)
    const payload: WordUpdatePayload = {
      name: word.name,
      entries: word.entries.map(({ id, ...rest }) => ({
        ...rest,
        note: rest.note || "" 
      }))
    };

    try {
      const isLocal = word.id.toString().startsWith("local-");
      if (isLocal) {
        syncedWords[i] = await createWord(childId, payload, userId);
      } else {
        try {
          syncedWords[i] = await updateWord(childId, word.id.toString(), payload, userId);
        } catch (err: any) {
          // Pokud slovo na serveru neexistuje (např. po resetu DB), vytvoříme ho znovu
          if (err.message.includes("404")) {
            syncedWords[i] = await createWord(childId, payload, userId);
          } else throw err;
        }
      }
    } catch (err) {
      console.error(`[SYNC-WORD] Chyba u slova ${word.name}:`, err);
    }
  }
  return syncedWords;
};

export const deleteWord = async (childId: string, wordId: string, userId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words/${wordId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to delete word');
};

// ============ TEETH API FUNCTIONS ============

// 1. Načtení dat 
export const fetchTeethRecords = async (childId: string, userId: string): Promise<TeethRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch teeth records');
  return response.json();
};

// 2. Funkce pro veškeré změny 
export const syncTeethRecords = async (
  childId: string, 
  userId: string, 
  records: Omit<TeethRecord, 'id' | 'child_id' | 'created_at'>[]
): Promise<TeethRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth/sync`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json', 
      'X-User-Id': userId 
    },
    body: JSON.stringify(records.map(r => ({
      tooth_id: r.tooth_id,
      date: r.date
    }))),
  });

  if (!response.ok) throw new Error('Teeth sync failed');
  return response.json();
};

// ============ FOOD API FUNCTIONS ============

// 1. Načtení všech záznamů
export const fetchFoodRecords = async (childId: string, userId: string): Promise<FoodRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/food`, {
    headers: { 'X-User-Id': userId }
  });
  if (!response.ok) throw new Error('Failed to fetch food records');
  return response.json();
};

export const syncFoodRecords = async (
  childId: string, 
  foodRecords: FoodRecordCreate[], 
  userId: string
): Promise<FoodRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/food/sync`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'X-User-Id': userId 
    },
    body: JSON.stringify(foodRecords),
  });

  if (!response.ok) throw new Error('Failed to sync food records');
  return response.json();
};

// 2. Smazání (zůstává pro úplné odstranění vlastních potravin)
export const deleteFoodRecord = async (
  childId: string, 
  foodLabel: string,
  userId: string
): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/children/${childId}/food/name/${encodeURIComponent(foodLabel)}`, 
    {
      method: 'DELETE',
      headers: { 'X-User-Id': userId }
    }
  );
  if (!response.ok) throw new Error('Failed to delete food record');
};

// ============ DIARY API FUNCTIONS ============

export const fetchDiaryEntries = async (childId: string, userId: string): Promise<Diary[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/diary`, {
    method: 'GET',
    headers: { 
      'X-User-Id': userId,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch diary entries');
  }
  
  return response.json();
};

export const createDiaryEntry = async (
  childId: string, 
  userId: string, 
  diaryData: DiaryCreate
): Promise<Diary> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/diary`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'X-User-Id': userId 
    },
    body: JSON.stringify(diaryData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create diary entry');
  }

  return response.json();
};

export const updateDiaryEntry = async (
  childId: string, 
  userId: string, 
  diaryId: string, 
  diaryData: DiaryUpdate
): Promise<Diary> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/diary/${diaryId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json', 
      'X-User-Id': userId 
    },
    body: JSON.stringify(diaryData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update diary entry');
  }

  return response.json();
};

export const deleteDiaryEntry = async (
  childId: string, 
  userId: string, 
  diaryId: string
): Promise<void> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/diary/${diaryId}`, {
    method: 'DELETE',
    headers: { 
      'X-User-Id': userId 
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete diary entry');
  }
};