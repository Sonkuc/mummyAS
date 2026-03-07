// API functions for backend integration using fetch
// Assumes backend is running on http://localhost:8000 (adjust if needed, e.g., for mobile use your machine's IP)

import { BreastfeedingRecord, BreastfeedingStats, Child, FoodRecord, Milestone, SleepRecord, SleepStats, TeethRecord, WeightHeight, Word } from "./interfaces";

const BASE_URL = 'http://192.168.31.152:8000'; // Change to your backend URL for mobile testing

// ============ CHILD API FUNCTIONS ============

export const fetchChildren = async (): Promise<Child[]> => {
  const response = await fetch(`${BASE_URL}/children`);
  if (!response.ok) throw new Error('Failed to fetch children');
  return response.json() as Promise<Child[]>;
};

export const createChild = async (childData: Child): Promise<Child> => {
  const response = await fetch(`${BASE_URL}/children`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(childData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[API ERROR] CreateChild status: ${response.status}`, errorData);
    throw new Error('Failed to create child');
  }
  return response.json() as Promise<Child>;
};

export const fetchChild = async (childId: string): Promise<Child> => {
  const response = await fetch(`${BASE_URL}/children/${childId}`);
  if (!response.ok) throw new Error('Failed to fetch child');
  return response.json() as Promise<Child>;
};

export const updateChild = async (childId: string, childData: Child): Promise<Child> => {
  // 1. Pokus o běžnou aktualizaci
  const response = await fetch(`${BASE_URL}/children/${childId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(childData),
  });
  // 2. Pokud dítě na serveru neexistuje (404), musíme ho vytvořit
  if (response.status === 404) {
    console.log(`[API] Dítě ${childId} nenalezeno, vytvářím nové...`);
    return await createChild(childData);
  }
  // 3. Ošetření ostatních chyb
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[API ERROR] UpdateChild status: ${response.status}`, errorData);
        throw new Error(`Sync failed with status ${response.status}`);
  }
  return response.json() as Promise<Child>;
};

export const deleteChild = async (childId: string): Promise<Response> => {
  const response = await fetch(`${BASE_URL}/children/${childId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete child');
  return response;
};

// ============ MILESTONE API FUNCTIONS ============

// Vrací pole milníků pro konkrétní dítě
export const fetchMilestones = async (childId: string): Promise<Milestone[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones`);
  if (!response.ok) throw new Error('Failed to fetch milestones');
  return response.json() as Promise<Milestone[]>;
};

// Vytvoření milníku
export const createMilestone = async (
  childId: string, 
  milestoneData: Omit<Milestone, 'id' | 'child_id'>
): Promise<Milestone> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(milestoneData),
  });
  if (!response.ok) throw new Error('Failed to create milestone');
  return response.json() as Promise<Milestone>;
};

// Detail jednoho milníku
export const fetchMilestone = async (childId: string, milestoneId: string): Promise<Milestone> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`);
  if (!response.ok) throw new Error('Failed to fetch milestone');
  return response.json() as Promise<Milestone>;
};

// Aktualizace milníku
export const updateMilestone = async (
  childId: string, 
  milestoneId: string, 
  milestoneData: Partial<Milestone>
): Promise<Milestone> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(milestoneData),
  });
  if (!response.ok) throw new Error('Failed to update milestone');
  return response.json() as Promise<Milestone>;
};

export const syncMilestones = async (childId: string, milestones: Milestone[]): Promise<Milestone[]> => {
  const syncedMilestones = [...milestones];
  for (let i = 0; i < syncedMilestones.length; i++) {
    const mil = syncedMilestones[i];
    try {
      const isLocal = mil.id.toString().startsWith("local-");
      if (isLocal) {
        // Nový milník z offline režimu
        syncedMilestones[i] = await createMilestone(childId, mil);
      } else {
        // Pokus o update existujícího
        try {
          await updateMilestone(childId, mil.id.toString(), mil);
        } catch (err: any) {
          // Pokud na serveru zmizel, znovu ho vytvoříme
          if (err.message.includes("404")) {
            syncedMilestones[i] = await createMilestone(childId, mil);
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
export const deleteMilestone = async (childId: string, milestoneId: string): Promise<Response> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete milestone');
  return response;
};

// ============ WEIGHT/HEIGHT API FUNCTIONS ============

// Získání všech záznamů
export const fetchWeightHeights = async (childId: string): Promise<WeightHeight[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height`);
  if (!response.ok) throw new Error('Failed to fetch weight/height records');
  return response.json() as Promise<WeightHeight[]>;
};

// Přidání jednoho záznamu
export const createWeightHeight = async (childId: string, data: Partial<WeightHeight>): Promise<WeightHeight> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create WH record');
  return response.json();
};

// Aktualizace jednoho záznamu
export const updateWeightHeight = async (childId: string, whId: string, data: Partial<WeightHeight>): Promise<WeightHeight> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height/${whId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`[API-WH-UPDATE-ERROR] ID: ${whId}`, JSON.stringify(errorBody, null, 2));
    throw new Error(`Failed to update WH record: ${response.status}`);
  }
  return response.json();
};

export const syncWeightHeights = async (childId: string, records: WeightHeight[]): Promise<WeightHeight[]> => {
  const syncedRecords = [...records];
  for (let i = 0; i < syncedRecords.length; i++) {
    const rec = syncedRecords[i];
    
    // Příprava čistého payloadu (převod stringů na čísla pro FastAPI)
    const payload = {
      date: rec.date,
      weight: rec.weight && rec.weight !== "" ? Number(rec.weight) : null,
      height: rec.height && rec.height !== "" ? Number(rec.height) : null,
      head: rec.head && rec.head !== "" ? Number(rec.head) : null,
      foot: rec.foot || null,
      clothes: rec.clothes || null
    };

    try {
      const isLocal = rec.id.toString().startsWith("local-");
      if (isLocal) {
        syncedRecords[i] = await createWeightHeight(childId, payload);
      } else {
        try {
          await updateWeightHeight(childId, rec.id.toString(), payload);
        } catch (err: any) {
          if (err.message.includes("404")) {
            syncedRecords[i] = await createWeightHeight(childId, payload);
          } else throw err;
        }
      }
    } catch (err) {
      console.error(`[SYNC-WH] Chyba u záznamu ${rec.date}:`, err);
    }
  }
  return syncedRecords;
};

// Smazání jednoho záznamu
export const deleteWeightHeight = async (childId: string, whId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height/${whId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete WH record');
};

// ============ SLEEP API FUNCTIONS ============

export const fetchSleepRecords = async (childId: string): Promise<SleepRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep`);
  if (!response.ok) throw new Error('Failed to fetch sleep records');
  return response.json() as Promise<SleepRecord[]>;
};

// Hromadné uložení - přijímá pole záznamů bez ID
export const createSleepBulk = async (
  childId: string, 
  sleepData: Omit<SleepRecord, 'id'>[]
): Promise<SleepRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sleepData),
  });
  if (!response.ok) throw new Error('Failed to create bulk sleep record');
  return response.json() as Promise<SleepRecord[]>;
};

export const fetchSleepRecord = async (childId: string, sleepId: string): Promise<SleepRecord> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/${sleepId}`);
  if (!response.ok) throw new Error('Failed to fetch sleep record');
  return response.json() as Promise<SleepRecord>;
};

// Statistiky pro grafy
export const fetchSleepStats = async (childId: string): Promise<SleepStats[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json() as Promise<SleepStats[]>;
};

// Aktualizace celého dne
export const updateSleepDay = async (
  childId: string, 
  date: string, 
  sleepData: Omit<SleepRecord, 'id'>[]
): Promise<SleepRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/day/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sleepData),
  });
  if (!response.ok) throw new Error('Failed to update sleep day');
  return response.json() as Promise<SleepRecord[]>;
};

export const updateSleepRecord = async (
  childId: string, 
  sleepId: string, 
  data: Partial<SleepRecord>
): Promise<SleepRecord> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/${sleepId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update sleep record');
  return response.json() as Promise<SleepRecord>;
};

export const deleteSleepRecord = async (childId: string, sleepId: string): Promise<Response> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/${sleepId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete sleep record');
  return response;
};

// ============ BREASTFEEDING API FUNCTIONS ============

export const fetchBreastfeedingRecords = async (childId: string): Promise<BreastfeedingRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding`);
  if (!response.ok) throw new Error('Failed to fetch breastfeeding records');
  return response.json() as Promise<BreastfeedingRecord[]>;
};

// Hromadné vytvoření - posíláme pole záznamů 
export const createBreastfeedingRecord = async (
  childId: string, 
  bfData: Omit<BreastfeedingRecord, 'id'>[]
): Promise<BreastfeedingRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bfData),
  });
  if (!response.ok) throw new Error('Failed to create breastfeeding record');
  return response.json() as Promise<BreastfeedingRecord[]>;
};

export const fetchBreastfeedingRecord = async (childId: string, bfId: string): Promise<BreastfeedingRecord> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/${bfId}`);
  if (!response.ok) throw new Error('Failed to fetch breastfeeding record');
  return response.json() as Promise<BreastfeedingRecord>;
};

export const fetchBreastfeedingStats = async (childId: string): Promise<BreastfeedingStats[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json() as Promise<BreastfeedingStats[]>;
};

export const updateBreastfeedingDay = async (
  childId: string, 
  date: string, 
  bfData: Omit<BreastfeedingRecord, 'id'>[]
): Promise<BreastfeedingRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/day/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bfData),
  });
  if (!response.ok) throw new Error('Failed to update breastfeeding day');
  return response.json() as Promise<BreastfeedingRecord[]>;
};

export const deleteBreastfeedingRecord = async (childId: string, bfId: string): Promise<Response> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/${bfId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete breastfeeding record');
  return response;
};

// ============ SPEAKING (WORD) API FUNCTIONS ============

// Pomocný typ pro záznam bez ID
export type CreateWordEntryRequest = {
  date: string;
  note?: string | null;
};

// Typ pro vytvoření celého slova
export type CreateWordRequest = {
  name: string;
  entries?: CreateWordEntryRequest[];
};

// Typ pro aktualizaci 
export type UpdateWordRequest = {
  name?: string;
  entries?: CreateWordEntryRequest[];
};

export const fetchWords = async (childId: string): Promise<Word[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words`);
  if (!response.ok) throw new Error('Failed to fetch words');
  return response.json() as Promise<Word[]>;
};

// Vytvoření slova 
export const createWord = async (
  childId: string, 
  wordData: CreateWordRequest
): Promise<Word> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wordData),
  });
  if (!response.ok) throw new Error('Failed to create word');
  return response.json() as Promise<Word>;
};

export const fetchWord = async (childId: string, wordId: string): Promise<Word> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words/${wordId}`);
  if (!response.ok) throw new Error('Failed to fetch word');
  return response.json() as Promise<Word>;
};

// Aktualizace slova
export const updateWord = async (
  childId: string, 
  wordId: string, 
  wordData: UpdateWordRequest
): Promise<Word> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words/${wordId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wordData),
  });
  if (!response.ok) throw new Error('Failed to update word');
  return response.json() as Promise<Word>;
};

export const syncWords = async (childId: string, words: Word[]): Promise<Word[]> => {
  const syncedWords = [...words];
  for (let i = 0; i < syncedWords.length; i++) {
    const word = syncedWords[i];
    const payload: CreateWordRequest = {
      name: word.name,
      entries: word.entries.map(e => ({ date: e.date, note: e.note || "" }))
    };

    try {
      const isLocal = word.id.toString().startsWith("local-");
      if (isLocal) {
        syncedWords[i] = await createWord(childId, payload);
      } else {
        try {
          await updateWord(childId, word.id.toString(), payload);
        } catch (err: any) {
          if (err.message.includes("404")) {
            syncedWords[i] = await createWord(childId, payload);
          } else throw err;
        }
      }
    } catch (err) {
      console.error(`[SYNC-WORD] Chyba u slova ${word.name}:`, err);
    }
  }
  return syncedWords;
};

export const deleteWord = async (childId: string, wordId: string): Promise<Response> => {
  const url = `${BASE_URL}/children/${childId}/words/${wordId}`;
  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Detail chyby smazání:", errorData);
    throw new Error('Failed to delete word');
  }
  return response;
};

// ============ TEETH API FUNCTIONS ============

// 1. Načtení dat 
export const fetchTeethRecords = async (childId: string): Promise<TeethRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth`);
  if (!response.ok) throw new Error('Failed to fetch teeth records');
  return response.json() as Promise<TeethRecord[]>;
};

// 2. Funkce pro veškeré změny 
export const syncTeethRecords = async (childId: string, records: any[]) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records.map(r => ({
      tooth_id: r.tooth_id,
      date: r.date
    }))),
  });
  if (!response.ok) throw new Error('Sync failed');
  return response.json();
};

// ============ FOOD API FUNCTIONS ============

// 1. Načtení všech záznamů
export const fetchFoodRecords = async (childId: string): Promise<FoodRecord[]> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/food`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error (fetchFoodRecords):", errorText);
    return []; 
  }

  return response.json() as Promise<FoodRecord[]>;
};

// 2. UNIVERZÁLNÍ FUNKCE (Upsert)
export const saveFoodRecord = async (
  childId: string, 
  foodData: { label: string, date: string, category: string }
): Promise<FoodRecord> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      food_name: foodData.label,
      date: foodData.date,       
      category: foodData.category,
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorBody = await response.json();
      console.error("FastAPI Validation Error:", JSON.stringify(errorBody, null, 2));
    } else {
      const errorText = await response.text();
      console.error("Server Error (500):", errorText);
    }
    throw new Error('Failed to save food record');
  }
  return response.json() as Promise<FoodRecord>;
};

// 3. Smazání záznamu
// EncodeURIComponent, aby jídla s mezerou nerozbila URL
export const deleteFoodRecord = async (childId: string, foodLabel: string): Promise<Response> => {
  const response = await fetch(`${BASE_URL}/children/${childId}/food/${encodeURIComponent(foodLabel)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete food record');
  return response;
};