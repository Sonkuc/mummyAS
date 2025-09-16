export function IsoFormatDate() {
  // Převod z ISO (YYYY-MM-DD) na český formát (DD.MM.YYYY)
  const formatDateToCzech = (isoDate: string): string => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
  };

  // Převod z českého formátu (DD.MM.YYYY) na ISO (YYYY-MM-DD)
  const toIsoDate = (czDate: string): string => {
    if (!czDate) return "";
    const [day, month, year] = czDate.split(".");
    return `${year}-${month}-${day}`;
  };

  return {
    formatDateToCzech,
    toIsoDate
  };
}