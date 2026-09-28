// Aanvankelijk rekenen, groep 3 (and the start of groep 4): counting and number sense to 20 with
// the five-structure, splitsen incl. the "vriendjes van 10", and + and - to 10, then to 20.
// Only tier 1 is labelled groep 3 (the start of the school year): a groep-3 child starts there
// and calibration moves them up. Higher tiers are what the class reaches by the end of groep 3.
// "dots": the dot picture is shown with the question; otherwise it appears as the first hint.
CURRICULUM.skills.push(
  {
    "id": "tellen_tot_20",
    "name": "Hoeveel stippen?",
    "category": "Tellen",
    "domain": "getallen",
    "description": "Stippen tellen in een rekenrek-beeld van 2 rijen van 5.",
    "exerciseType": "tellen",
    "implemented": true,
    "groepen": [3, 4],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 3, "min": 2, "max": 10 },
      { "tier": 2, "groep": 4, "min": 8, "max": 20 }
    ]
  },
  {
    "id": "rijtjes",
    "name": "Rijtjes: welk getal komt erna?",
    "category": "Tellen",
    "domain": "getallen",
    "description": "Doortellen en terugtellen: 3, 4, 5, ?",
    "exerciseType": "rijtjes",
    "implemented": true,
    "groepen": [3, 4],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 3, "max": 10, "steps": [1], "backward": false },
      { "tier": 2, "groep": 4, "max": 20, "steps": [1], "backward": true },
      { "tier": 3, "groep": 4, "max": 100, "steps": [1, 10], "backward": true }
    ]
  },
  {
    "id": "splitsen",
    "name": "Splitsen",
    "category": "Splitsen",
    "domain": "getallen",
    "description": "7 = 4 + ? Met de vriendjes van 10.",
    "exerciseType": "splitsen",
    "implemented": true,
    "groepen": [3, 4],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 3, "min": 3, "max": 10, "dots": true },
      { "tier": 2, "groep": 4, "min": 3, "max": 10, "tenShare": 0.4 },
      { "tier": 3, "groep": 4, "min": 11, "max": 20, "tenShare": 0.6 }
    ]
  },
  {
    "id": "plus_tot_20",
    "name": "Plussommen tot 20",
    "category": "Plus",
    "domain": "bewerkingen",
    "description": "Eerst tot 10 met stippen, dan tot 20, ook over de 10 heen.",
    "exerciseType": "plus_tot_20",
    "implemented": true,
    "groepen": [3, 4],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 3, "range": "tot10", "dots": true },
      { "tier": 2, "groep": 4, "range": "tot10" },
      { "tier": 3, "groep": 4, "range": "tot20" },
      { "tier": 4, "groep": 4, "range": "over10" }
    ]
  },
  {
    "id": "min_tot_20",
    "name": "Minsommen tot 20",
    "category": "Min",
    "domain": "bewerkingen",
    "description": "Eerst tot 10 met stippen, dan tot 20, ook over de 10 heen.",
    "exerciseType": "min_tot_20",
    "implemented": true,
    "groepen": [3, 4],
    "prerequisites": [],
    "tiers": [
      { "tier": 1, "groep": 3, "range": "tot10", "dots": true },
      { "tier": 2, "groep": 4, "range": "tot10" },
      { "tier": 3, "groep": 4, "range": "tot20" },
      { "tier": 4, "groep": 4, "range": "over10" }
    ]
  }
);
