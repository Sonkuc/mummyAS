export const formatDateLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const formatDateToCzech = (isoDate: string): string => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
};

export const toIsoDate = (czDate: string): string => {
  if (!czDate) return "";
  const [day, month, year] = czDate.split(".");
  return `${year}-${month}-${day}`;
};