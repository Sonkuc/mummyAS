import { Child } from "@/components/storage/interfaces";

/** Datum YYYY-MM-DD v místním čase, posunuté o daysAgo dní zpět. */
const day = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

let counter = 0;
const id = (prefix: string) => `demo-${prefix}-${++counter}`;

/**
 * Ukázkové dítě pro zkušební režim, aby bylo hned vidět, jak se data vykreslují.
 * Data se generují vždy znovu (relativně k dnešku) a drží se jen v paměti.
 */
export function createDemoChildren(): Child[] {
  counter = 0;
  const childId = "demo-child";

  // Spánek: posledních 7 dní – dva denní spánky a noc
  const sleepRecords: Child["sleepRecords"] = [];
  for (let i = 6; i >= 1; i--) {
    const date = day(i);
    const nap1 = 9 + (i % 2);
    sleepRecords.push(
      { id: id("s"), child_id: childId, date, time: "06:30", state: "awake" },
      { id: id("s"), child_id: childId, date, time: `${String(nap1).padStart(2, "0")}:15`, state: "sleep" },
      { id: id("s"), child_id: childId, date, time: `${String(nap1 + 1).padStart(2, "0")}:30`, state: "awake" },
      { id: id("s"), child_id: childId, date, time: "13:00", state: "sleep" },
      { id: id("s"), child_id: childId, date, time: i % 3 === 0 ? "15:00" : "14:40", state: "awake" },
      { id: id("s"), child_id: childId, date, time: "19:45", state: "sleep" },
    );
  }

  // Dnešek: ranní probuzení (jen pokud už je po 6:30), ať noční spánek správně končí
  const now = new Date();
  if (now.getHours() > 6 || (now.getHours() === 6 && now.getMinutes() >= 30)) {
    sleepRecords.push({ id: id("s"), child_id: childId, date: day(0), time: "06:30", state: "awake" });
  }

  // Kojení: posledních 7 dní, 4–5 kojení denně
  const breastfeedingRecords: Child["breastfeedingRecords"] = [];
  for (let i = 6; i >= 1; i--) {
    const date = day(i);
    const times: [string, string][] = [
      ["06:40", "06:55"],
      ["10:35", "10:50"],
      ["14:50", "15:10"],
      ["19:20", "19:40"],
    ];
    if (i % 2 === 0) times.push(["23:30", "23:45"]);
    for (const [start, stop] of times) {
      breastfeedingRecords.push(
        { id: id("bf"), child_id: childId, date, time: start, state: "start" },
        { id: id("bf"), child_id: childId, date, time: stop, state: "stop" },
      );
    }
  }

  return [
    {
      id: childId,
      user_id: "guest",
      name: "Ukázková Anička",
      sex: "divka",
      birthDate: day(300),
      photo: "avatar5",
      currentModeSleep: null,
      currentModeFeed: null,
      sleepRecords,
      breastfeedingRecords,
      milestones: [
        { id: id("m"), child_id: childId, name: "První úsměv", date: day(255), note: "Na tatínka" },
        { id: id("m"), child_id: childId, name: "Přetočím se na bříško", date: day(170) },
        { id: id("m"), child_id: childId, name: "První sed", date: day(60) },
      ],
      words: [
        { id: id("w"), child_id: childId, name: "máma", entries: [{ id: id("we"), date: day(20), note: "" }] },
        { id: id("w"), child_id: childId, name: "haf", entries: [{ id: id("we"), date: day(9), note: "Když viděla psa" }] },
      ],
      teethRecords: [
        { id: id("t"), child_id: childId, tooth_id: "L1", date: day(80) },
        { id: id("t"), child_id: childId, tooth_id: "L2", date: day(74) },
      ],
      wh: [
        { id: id("wh"), child_id: childId, date: day(300), weight: 3.4, height: 50, head: 34 },
        { id: id("wh"), child_id: childId, date: day(240), weight: 5.6, height: 58, head: 38 },
        { id: id("wh"), child_id: childId, date: day(150), weight: 7.1, height: 65, head: 42 },
        { id: id("wh"), child_id: childId, date: day(30), weight: 8.4, height: 71, head: 44 },
      ],
      foodRecords: [
        { id: id("f"), child_id: childId, food_name: "Mrkev", category: "vegetable", date: day(120) },
        { id: id("f"), child_id: childId, food_name: "Jablka", category: "fruit", date: day(110) },
        { id: id("f"), child_id: childId, food_name: "Rýže", category: "cereal", date: day(95) },
      ],
      diaryRecords: [
        {
          id: id("d"),
          child_id: childId,
          name: "První výlet",
          text: "Dnes jsme byly poprvé na výletě v ZOO. Nejvíc se jí líbily opice.",
          date: day(14),
        },
      ],
    },
  ];
}
