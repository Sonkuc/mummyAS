// Zkontroluje, že je string validní datum YYYY-MM-DD a existuje v kalendáři
export const isValidDateString = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  
  if (y < 1900 || y > 2200) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
};

export const isFutureDateTime = (date: string, time: string) => {
  const [hh, mm] = time.split(":").map(Number);
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm);
  return dt.getTime() > Date.now();
};

export const validateDate = (
  date: string,
  birthISO: string | null | undefined,
  allowPastDates = false
): string | null => {
  // 1. Základní kontrola formátu
  if (!isValidDateString(date)) {
    return "Zadej platné datum ve formátu RRRR-MM-DD.";
  }

  // Převod na Date objekty pro spolehlivé porovnání
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Kontrola budoucnosti
  if (selectedDate > today) {
    return "Nelze přidat záznam s budoucím datem.";
  }

  // 3. Kontrola data narození
  if (birthISO) {
    const cleanBirthISO = birthISO.includes('.') || birthISO.includes('/') 
                          ? birthISO.replace(/\//g, "-").replace(/\./g, "-") 
                          : birthISO;
    
    const birthDate = new Date(cleanBirthISO);
    birthDate.setHours(0, 0, 0, 0);

    if (selectedDate < birthDate) {
      // Převedeme pro uživatele na hezký formát v hlášce
      const displayBirth = birthDate.toLocaleDateString("cs-CZ");
      return `Datum nemůže být starší než datum narození (${displayBirth}).`;
    }
  } else {
    // Pokud datum narození neznáme
    if (!allowPastDates) {
      const minDate = new Date("1900-01-01");
      if (selectedDate < minDate) {
        return "Datum je příliš staré.";
      }
    }
  }

  return null;
};