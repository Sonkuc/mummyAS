export const formatDateLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const formatDateToCzech = (isoDate: string): string => {
  if (!isoDate || isoDate.includes("undefined")) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate; // Vrátí původní, pokud to není ISO
  const [year, month, day] = parts;
  return `${day}.${month}.${year}`;
};

export const toIsoDate = (dateStr: string): string => {
  if (!dateStr || dateStr.includes("undefined")) return "";
  
  // Nahradíme lomítka tečkami, abychom sjednotili vstup
  const cleanDate = dateStr.replace(/\//g, ".");
  const parts = cleanDate.split(".");
  
  if (parts.length === 3) {
    const [d, m, y] = parts;
    // Pokud je první část rok (Swagger formát YYYY.MM.DD)
    if (d.length === 4) return `${d}-${m.padStart(2, "0")}-${y.padStart(2, "0")}`;
    // Pokud je poslední část rok (Czech formát DD.MM.YYYY)
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr; // Vrátíme jak je, pokud nerozpoznáme
};