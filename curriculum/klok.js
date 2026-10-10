// Klokkijken. Learning line: hele uren -> halve uren -> kwartieren -> 5 minuten -> to the minute,
// first on the wijzerklok, then digital with the 24-hour clock. A wijzerklok doesn't show the
// dagdeel, so 3:15 and 15:15 both count; levels with "dagdeel" state it ('s middags) and then
// only the 24-hour time is right. Tier labels: the groep it fits at the start of the school year.
// "minutes": which minutes can occur on that level (a step of 5 = every 5 minutes, 1 = any minute).
CURRICULUM.skills.push(
  {
    "id": "klok_hele_uren",
    "name": "Klok: hele uren",
    "category": "Klok",
    "domain": "meten",
    "description": "Een wijzerklok op een heel uur; alleen het uur typen.",
    "exerciseType": "klok_uur",
    "implemented": true,
    "groepen": [3, 4],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 3 }
    ]
  },
  {
    "id": "klokkijken",
    "name": "Klokkijken",
    "category": "Klok",
    "domain": "meten",
    "description": "Een wijzerklok aflezen en de tijd typen als uur : minuten.",
    "exerciseType": "klok",
    "implemented": true,
    "groepen": [4, 8],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 4, "minutes": [0, 30] },
      { "tier": 2, "groep": 4, "minutes": [0, 15, 30, 45] },
      { "tier": 3, "groep": 5, "minuteStep": 5 },
      { "tier": 4, "groep": 5, "minuteStep": 1 },
      { "tier": 5, "groep": 6, "minuteStep": 1, "dagdeel": true }
    ]
  },
  {
    "id": "klok_woorden",
    "name": "Tijd in woorden",
    "category": "Klok",
    "domain": "meten",
    "description": "Een tijd in woorden (kwart voor 4, 10 voor half 4) omzetten naar uur : minuten.",
    "exerciseType": "klok_woorden",
    "implemented": true,
    "groepen": [4, 8],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 4, "minutes": [0, 15, 30, 45] },
      { "tier": 2, "groep": 5, "minuteStep": 5 },
      { "tier": 3, "groep": 5, "minuteStep": 1 },
      { "tier": 4, "groep": 6, "minuteStep": 5, "dagdeel": true }
    ]
  }
);
