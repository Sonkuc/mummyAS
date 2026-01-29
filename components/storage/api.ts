// API functions for backend integration using fetch
// Assumes backend is running on http://localhost:8000 (adjust if needed, e.g., for mobile use your machine's IP)

const BASE_URL = 'http://192.168.31.152:8000'; // Change to your backend URL for mobile testing

// ============ CHILD API FUNCTIONS ============

export const fetchChildren = async () => {
  const response = await fetch(`${BASE_URL}/children`);
  if (!response.ok) throw new Error('Failed to fetch children');
  return response.json();
};

export const createChild = async (childData: any) => {
  const response = await fetch(`${BASE_URL}/children`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(childData),
  });

  if (!response.ok) {
    throw new Error('Failed to create child');
  }
  return response.json();
};

export const fetchChild = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}`);
  if (!response.ok) throw new Error('Failed to fetch child');
  return response.json();
};

export const updateChild = async (childId: string, childData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(childData),
  });
  if (!response.ok) throw new Error('Failed to update child');
  return response.json();
};

export const deleteChild = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete child');
  return response;
};

// ============ MILESTONE API FUNCTIONS ============

export const fetchMilestones = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones`);
  if (!response.ok) throw new Error('Failed to fetch milestones');
  return response.json();
};

export const createMilestone = async (childId: string, milestoneData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(milestoneData),
  });
  if (!response.ok) throw new Error('Failed to create milestone');
  return response.json();
};

export const fetchMilestone = async (childId: string, milestoneId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`);
  if (!response.ok) throw new Error('Failed to fetch milestone');
  return response.json();
};

export const updateMilestone = async (childId: string, milestoneId: string, milestoneData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(milestoneData),
  });
  if (!response.ok) throw new Error('Failed to update milestone');
  return response.json();
};

export const deleteMilestone = async (childId: string, milestoneId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/milestones/${milestoneId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete milestone');
  return response;
};

// ============ WEIGHT/HEIGHT API FUNCTIONS ============

export const fetchWeightHeights = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height`);
  if (!response.ok) throw new Error('Failed to fetch weight/height records');
  return response.json();
};

export const createWeightHeight = async (childId: string, whData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(whData),
  });
  if (!response.ok) throw new Error('Failed to create weight/height record');
  return response.json();
};

export const fetchWeightHeight = async (childId: string, whId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height/${whId}`);
  if (!response.ok) throw new Error('Failed to fetch weight/height record');
  return response.json();
};

export const updateWeightHeight = async (childId: string, whId: string, whData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height/${whId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(whData),
  });
  if (!response.ok) throw new Error('Failed to update weight/height record');
  return response.json();
};

export const deleteWeightHeight = async (childId: string, whId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/weight-height/${whId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete weight/height record');
  return response;
};

// ============ SLEEP API FUNCTIONS ============

export const fetchSleepRecords = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep`);
  if (!response.ok) throw new Error('Failed to fetch sleep records');
  return response.json();
};

export const createSleepBulk = async (childId: string, sleepData: any[]) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sleepData),
  });
  if (!response.ok) throw new Error('Failed to create bulk sleep record');
  return response.json();
};

export const fetchSleepRecord = async (childId: string, sleepId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/${sleepId}`);
  if (!response.ok) throw new Error('Failed to fetch sleep record');
  return response.json();
};

export const fetchSleepStats = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json(); // Vrátí Array<{date: string, total_minutes: number}>
};

export const updateSleepDay = async (childId: string, date: string, sleepData: any[]) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/day/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sleepData),
  });
  if (!response.ok) throw new Error('Failed to update sleep day');
  return response.json();
};

export const updateSleepRecord = async (childId: string, sleepId: string, data: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/${sleepId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update sleep record');
  return response.json();
};

export const deleteSleepRecord = async (childId: string, sleepId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/sleep/${sleepId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete sleep record');
  return response;
};

// ============ BREASTFEEDING API FUNCTIONS ============

export const fetchBreastfeedingRecords = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding`);
  if (!response.ok) throw new Error('Failed to fetch breastfeeding records');
  return response.json();
};

export const createBreastfeedingRecord = async (childId: string, bfData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bfData),
  });
  if (!response.ok) throw new Error('Failed to create breastfeeding record');
  return response.json();
};

export const fetchBreastfeedingRecord = async (childId: string, bfId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/${bfId}`);
  if (!response.ok) throw new Error('Failed to fetch breastfeeding record');
  return response.json();
};

export const fetchBreastfeedingStats = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json(); // Vrátí Array<{date: string, total_minutes: number}>
};

export const updateBreastfeedingDay = async (childId: string, date: string, bfData: any[]) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/day/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bfData),
  });
  if (!response.ok) throw new Error('Failed to update breastfeeding day');
  return response.json();
};

export const deleteBreastfeedingRecord = async (childId: string, bfId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/breastfeeding/${bfId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete breastfeeding record');
  return response;
};

// ============ SPEAKING (WORD) API FUNCTIONS ============

export const fetchWords = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words`);
  if (!response.ok) throw new Error('Failed to fetch words');
  return response.json();
};

export const createWord = async (childId: string, wordData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wordData),
  });
  if (!response.ok) throw new Error('Failed to create word');
  return response.json();
};

export const fetchWord = async (childId: string, wordId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words/${wordId}`);
  if (!response.ok) throw new Error('Failed to fetch word');
  return response.json();
};

export const updateWord = async (childId: string, wordId: string, wordData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/words/${wordId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wordData),
  });
  if (!response.ok) throw new Error('Failed to update word');
  return response.json();
};

export const deleteWord = async (childId: string, wordId: string) => {
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

export const fetchTeethRecords = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth`);
  if (!response.ok) throw new Error('Failed to fetch teeth records');
  return response.json();
};

export const createTeethRecord = async (childId: string, teethData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teethData),
  });
  if (!response.ok) throw new Error('Failed to create teeth record');
  return response.json();
};

export const fetchTeethRecord = async (childId: string, teethId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth/${teethId}`);
  if (!response.ok) throw new Error('Failed to fetch teeth record');
  return response.json();
};

export const updateTeethRecord = async (childId: string, teethId: string, teethData: any) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth/${teethId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teethData),
  });
  if (!response.ok) throw new Error('Failed to update teeth record');
  return response.json();
};

export const deleteTeethRecord = async (childId: string, teethId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/teeth/${teethId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete teeth record');
  return response;
};

// ============ FOOD API FUNCTIONS ============

// 1. Načtení všech záznamů o jídle pro dané dítě
export const fetchFoodRecords = async (childId: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/food`);
  
  if (!response.ok) {
    // Pokud server spadne, vypíšeme text chyby místo pokusu o parsování JSONu
    const errorText = await response.text();
    console.error("API Error (fetchFoodRecords):", errorText);
    return []; // Vrátíme prázdné pole, aby kontext mohl pokračovat
  }

  return response.json();
};

// 2. UNIVERZÁLNÍ FUNKCE (Upsert): Přidá nebo aktualizuje datum u potraviny
export const saveFoodRecord = async (childId: string, foodData: { label: string, date: string, category: string }) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      food_name: foodData.label, // Převod na snake_case pro backend
      date: foodData.date,       
      category: foodData.category,
    }),
  });

  if (!response.ok) {
    // Pokud je to chyba 422, FastAPI pošle JSON, pokud 500, pošle text.
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
  return response.json();
};

// 3. Smazání záznamu (Resetování potraviny)
export const deleteFoodRecord = async (childId: string, foodLabel: string) => {
  const response = await fetch(`${BASE_URL}/children/${childId}/food/${encodeURIComponent(foodLabel)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete food record');
  return response;
};