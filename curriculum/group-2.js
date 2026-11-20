// Groep 2 (kleuters, BACKLOG D26): getallen tot en met 20 herkennen. The child can't read yet, so
// everything is read aloud and answered by tapping a big card or by saying the number (🎤).
// `choices` = how many cards; `tricky` = the other cards are the ones a kleuter mixes up (4 next
// to 14: "veertien" says the 4 first; 6 and 9; neighbours). Levels are stored by number: adding
// one in between moves a child above it one step down.
CURRICULUM.skills.push(
  {
    "id": "getal_kiezen",
    "name": "Luister en tik",
    "category": "Getallen tot 20",
    "domain": "getallen",
    "description": "De app zegt een getal; tik het goede kaartje aan.",
    "exerciseType": "getal_kiezen",
    "implemented": true,
    "groepen": [2, 2],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 2, "min": 1, "max": 6, "choices": 3 },
      { "tier": 2, "groep": 2, "min": 1, "max": 10, "choices": 3 },
      { "tier": 3, "groep": 2, "min": 11, "max": 20, "choices": 4 },
      { "tier": 4, "groep": 3, "min": 0, "max": 20, "choices": 4, "tricky": true }
    ]
  },
  {
    "id": "stippen_kiezen",
    "name": "Tel en tik",
    "category": "Getallen tot 20",
    "domain": "getallen",
    "description": "Stippen in rijtjes van 5 en 10; tik het getal dat erbij hoort.",
    "exerciseType": "stippen_kiezen",
    "implemented": true,
    "groepen": [2, 2],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 2, "min": 1, "max": 5, "choices": 3 },
      { "tier": 2, "groep": 2, "min": 1, "max": 10, "choices": 3 },
      { "tier": 3, "groep": 3, "min": 11, "max": 20, "choices": 4 }
    ]
  },
  {
    "id": "rij_gat",
    "name": "Welk getal mist?",
    "category": "Getallen tot 20",
    "domain": "getallen",
    "description": "Een rij van 5 getallen met een gat: 3, 4, _, 6, 7.",
    "exerciseType": "rij_gat",
    "implemented": true,
    "groepen": [2, 2],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 2, "max": 10, "gap": "end", "choices": 3 },
      { "tier": 2, "groep": 2, "max": 10, "gap": "any", "choices": 3 },
      { "tier": 3, "groep": 3, "max": 20, "gap": "any", "choices": 3 }
    ]
  },
  {
    "id": "getal_zeggen",
    "name": "Zeg het getal",
    "category": "Getallen tot 20",
    "domain": "getallen",
    "description": "Een groot getal: zeg hardop welk getal het is (🎤).",
    "exerciseType": "getal_zeggen",
    "implemented": true,
    "groepen": [2, 2],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 2, "min": 1, "max": 10 },
      { "tier": 2, "groep": 2, "min": 11, "max": 20 },
      { "tier": 3, "groep": 3, "min": 0, "max": 20 }
    ]
  }
);
