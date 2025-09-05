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
  birthISO: string | null,
  allowPastDates = false
): string | null => {
  if (!isValidDateString(date)) {
    return "Zadej platné datum ve formátu YYYY-MM-DD.";
  }

  const todayISO = new Date().toISOString().slice(0, 10);

  if (date > todayISO) {
    return "Nelze přidat záznam s budoucím datem.";
  }

  if (birthISO) {
    if (date < birthISO) {
      return "Datum nemůže být před narozením.";
    }
  } else {
    // Datum narození neznáme → pokud allowPastDates je false, zakážeme moc stará data
    if (!allowPastDates) {
      const minISO = "1900-01-01"; // můžeš si změnit podle potřeby
      if (date < minISO) {
        return `Datum nesmí být starší než ${minISO}.`;
      }
    }
  }

  return null;
};