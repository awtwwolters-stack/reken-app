// Each tier's "groep": the groep that level fits at the start of the school year. A new skill starts at
// the highest tier labelled at or below the child's groep; the app then adapts within 1-2 sessions.
// Tafels per De Wereld in Getallen: 0-5 + 10 automated by end of groep 4, all 0-10 by mid groep 5.
// Keersommen are levelled by kind of sum, not by a maximum, so one level holds sums of similar
// difficulty: groep 5 "after the tafels, × tientallen and samengestelde getallen" (3 × 40, 3 × 24),
// groep 6 hoofdrekenen like 7 × 49 (DWiG groep-6 doelen). Written the school way: small number first.
// Plus/min: groep 5 tot 1000, groep 6 tot 10.000 - first with handy numbers (560 - 240, 4.500 - 1.200,
// 473 - 298: "handig"); any 4-digit numbers with inwisselen come mid groep 6, written out (cijferen),
// so they stay groep 7 for hoofdrekenen. Delen: groep 5 deeltafels t/m 10 and with rest, larger
// numbers from the second half of groep 5 (same doelen).
// A skill's maximum level is the number of entries in its `tiers`.
// "groepen": [from, to] - a child only practises skills whose range includes their groep.
const CURRICULUM = {
  "group": 6,
  "sources": [
    "SLO Tussendoelen rekenen-wiskunde PO",
    "De Wereld in Getallen (Malmberg) - groep 6 domeinstructuur"
  ],
  "skills": [
    {
      "id": "getalbegrip_tot_100000",
      "name": "Getalbegrip tot 100.000",
      "category": "Getallen",
      "domain": "getallen",
      "description": "Grote getallen vergelijken, ordenen en afronden.",
      "exerciseType": "getalbegrip",
      "implemented": true,
      "groepen": [5, 8],
      "prerequisites": [],
      "tiers": [
        { "tier": 1, "groep": 5, "max": 1000 },
        { "tier": 2, "groep": 6, "max": 10000 },
        { "tier": 3, "groep": 7, "max": 50000 },
        { "tier": 4, "groep": 7, "max": 100000 }
      ]
    },
    {
      "id": "optellen_tot_100000",
      "name": "Optellen tot 100.000",
      "category": "Optellen",
      "domain": "bewerkingen",
      "description": "Optellen met grotere getallen, ook kolomsgewijs. Uitkomst blijft binnen het bereik van de tier.",
      "exerciseType": "optellen",
      "implemented": true,
      "groepen": [4, 8],
      "prerequisites": ["getalbegrip_tot_100000"],
      "tiers": [
        { "tier": 1, "groep": 4, "min": 1, "max": 50 },
        { "tier": 2, "groep": 5, "min": 10, "max": 500 },
        { "tier": 3, "groep": 6, "handig": true },
        { "tier": 4, "groep": 7, "min": 100, "max": 5000 },
        { "tier": 5, "groep": 7, "min": 1000, "max": 50000 }
      ]
    },
    {
      "id": "aftrekken_tot_100000",
      "name": "Aftrekken tot 100.000",
      "category": "Aftrekken",
      "domain": "bewerkingen",
      "description": "Aftrekken met grotere getallen, ook kolomsgewijs.",
      "exerciseType": "aftrekken",
      "implemented": true,
      "groepen": [4, 8],
      "prerequisites": ["getalbegrip_tot_100000"],
      "tiers": [
        { "tier": 1, "groep": 4, "min": 1, "max": 100 },
        { "tier": 2, "groep": 5, "min": 10, "max": 1000 },
        { "tier": 3, "groep": 6, "handig": true },
        { "tier": 4, "groep": 7, "min": 100, "max": 10000 },
        { "tier": 5, "groep": 7, "min": 1000, "max": 100000 }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_6",
      "name": "Tafel van 6",
      "category": "Tafels",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 6.",
      "exerciseType": "tafel",
      "table": 6,
      "implemented": true,
      "groepen": [4, 8],
      "prerequisites": [],
      "tiers": [
        { "tier": 1, "groep": 4, "multiplierMax": 5 },
        { "tier": 2, "groep": 5, "multiplierMax": 10 },
        { "tier": 3, "groep": 6, "multiplierMax": 10, "askMissingFactor": true }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_7",
      "name": "Tafel van 7",
      "category": "Tafels",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 7.",
      "exerciseType": "tafel",
      "table": 7,
      "implemented": true,
      "groepen": [4, 8],
      "prerequisites": [],
      "tiers": [
        { "tier": 1, "groep": 4, "multiplierMax": 5 },
        { "tier": 2, "groep": 5, "multiplierMax": 10 },
        { "tier": 3, "groep": 6, "multiplierMax": 10, "askMissingFactor": true }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_8",
      "name": "Tafel van 8",
      "category": "Tafels",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 8.",
      "exerciseType": "tafel",
      "table": 8,
      "implemented": true,
      "groepen": [4, 8],
      "prerequisites": [],
      "tiers": [
        { "tier": 1, "groep": 4, "multiplierMax": 5 },
        { "tier": 2, "groep": 5, "multiplierMax": 10 },
        { "tier": 3, "groep": 6, "multiplierMax": 10, "askMissingFactor": true }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_9",
      "name": "Tafel van 9",
      "category": "Tafels",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 9.",
      "exerciseType": "tafel",
      "table": 9,
      "implemented": true,
      "groepen": [4, 8],
      "prerequisites": [],
      "tiers": [
        { "tier": 1, "groep": 4, "multiplierMax": 5 },
        { "tier": 2, "groep": 5, "multiplierMax": 10 },
        { "tier": 3, "groep": 6, "multiplierMax": 10, "askMissingFactor": true }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_10",
      "name": "Tafel van 10",
      "category": "Tafels",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 10.",
      "exerciseType": "tafel",
      "table": 10,
      "implemented": true,
      "groepen": [4, 8],
      "prerequisites": [],
      "tiers": [
        { "tier": 1, "groep": 4, "multiplierMax": 5 },
        { "tier": 2, "groep": 5, "multiplierMax": 10 },
        { "tier": 3, "groep": 6, "multiplierMax": 10, "askMissingFactor": true }
      ]
    },
    {
      "id": "vermenigvuldigen_grote_getallen",
      "name": "Vermenigvuldigen met grotere getallen",
      "category": "Keersommen",
      "domain": "bewerkingen",
      "description": "Een getal van twee cijfers keer een getal van één cijfer.",
      "exerciseType": "vermenigvuldigen_groot",
      "implemented": true,
      "groepen": [5, 8],
      "prerequisites": ["vermenigvuldigen_tafel_6", "vermenigvuldigen_tafel_7", "vermenigvuldigen_tafel_8", "vermenigvuldigen_tafel_9"],
      "tiers": [
        { "tier": 1, "groep": 5, "multiplier": [2, 5], "number": [20, 90], "roundTens": true },
        { "tier": 2, "groep": 5, "multiplier": [2, 5], "number": [11, 30] },
        { "tier": 3, "groep": 6, "multiplier": [2, 9], "number": [11, 50] },
        { "tier": 4, "groep": 7, "multiplier": [6, 9], "number": [51, 99] }
      ]
    },
    {
      "id": "delen_zonder_rest",
      "name": "Delen zonder rest",
      "category": "Delen",
      "domain": "bewerkingen",
      "description": "Deelsommen die precies uitkomen.",
      "exerciseType": "delen_zonder_rest",
      "implemented": true,
      "groepen": [4, 8],
      "prerequisites": ["vermenigvuldigen_tafel_6", "vermenigvuldigen_tafel_7", "vermenigvuldigen_tafel_8", "vermenigvuldigen_tafel_9"],
      "tiers": [
        { "tier": 1, "groep": 4, "divisorMax": 5, "quotientMax": 10 },
        { "tier": 2, "groep": 5, "divisorMax": 10, "quotientMax": 10 },
        { "tier": 3, "groep": 6, "divisorMax": 10, "quotientMax": 20 },
        { "tier": 4, "groep": 6, "divisorMax": 10, "quotientMax": 10, "zeros": true }
      ]
    },
    {
      "id": "delen_met_rest",
      "name": "Delen met rest",
      "category": "Delen",
      "domain": "bewerkingen",
      "description": "Deelsommen waar een rest overblijft.",
      "exerciseType": "delen_met_rest",
      "implemented": true,
      "groepen": [5, 8],
      "prerequisites": ["delen_zonder_rest"],
      "tiers": [
        { "tier": 1, "groep": 5, "divisorMax": 5, "quotientMax": 8 },
        { "tier": 2, "groep": 6, "divisorMax": 8, "quotientMax": 10 },
        { "tier": 3, "groep": 7, "divisorMax": 10, "quotientMax": 12 },
        { "tier": 4, "groep": 7, "divisorMax": 10, "quotientMax": 20 }
      ]
    },
    {
      "id": "verhaalsom_basisbewerkingen",
      "name": "Verhaalsommen",
      "category": "Verhaalsommen",
      "domain": "verhaalsommen",
      "description": "Rekenverhalen met optellen, aftrekken, vermenigvuldigen en delen.",
      "exerciseType": "verhaalsom",
      "implemented": true,
      "groepen": [5, 8],
      "prerequisites": ["optellen_tot_100000", "aftrekken_tot_100000", "vermenigvuldigen_grote_getallen", "delen_zonder_rest"],
      "tiers": [
        { "tier": 1, "groep": 5, "max": 100 },
        { "tier": 2, "groep": 6, "max": 500 },
        { "tier": 3, "groep": 7, "max": 1000 }
      ]
    },
    {
      "id": "breuken_herkennen",
      "name": "Breuken herkennen",
      "category": "Breuken",
      "domain": "breuken",
      "description": "Welk deel van een strook is gekleurd? Groep-5-herhaling; zesden/tienden pas als de klas zover is.",
      "exerciseType": "breuk_herkennen",
      "implemented": true,
      "groepen": [5, 8],
      "prerequisites": [],
      "tiers": [
        { "tier": 1, "groep": 5, "denominators": [2, 4] },
        { "tier": 2, "groep": 7, "denominators": [2, 3, 4, 5, 8] }
      ]
    },
    {
      "id": "breuken_deel_van",
      "name": "Deel van een hoeveelheid",
      "category": "Breuken",
      "domain": "breuken",
      "description": "Een stambreuk van een getal, zoals ¼ van 20; op het hoogste niveau ook ¾ van 20 (midden groep 6, alleen bereikbaar door te stijgen).",
      "exerciseType": "breuk_deel_van",
      "implemented": true,
      "groepen": [5, 8],
      "prerequisites": ["delen_zonder_rest"],
      "tiers": [
        { "tier": 1, "groep": 5, "denominators": [2, 4], "quotientMax": 10 },
        { "tier": 2, "groep": 7, "denominators": [2, 3, 4, 5, 10], "quotientMax": 10 },
        { "tier": 3, "groep": 7, "denominators": [3, 4, 5, 8, 10], "quotientMax": 6, "nonUnit": true }
      ]
    },
    {
      "id": "breuken_vergelijken_gelijkwaardig",
      "name": "Breuken vergelijken en gelijkwaardige breuken",
      "category": "Breuken",
      "domain": "breuken",
      "description": "3/8 of 5/8? 1/3 = 2/6. Bouwen zodra de klas zover is (B-04).",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": ["breuken_herkennen"],
      "tiers": []
    },
    {
      "id": "breuken_kommagetallen",
      "name": "Beginnende decimalen (kommagetallen)",
      "category": "Breuken",
      "domain": "breuken",
      "description": "Kommagetallen lezen, plaatsen op de getallenlijn.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": ["breuken_herkennen"],
      "tiers": []
    },
    {
      "id": "verhoudingen_schaal",
      "name": "Verhoudingen: schaal en snelheid",
      "category": "Verhoudingen",
      "domain": "verhoudingen",
      "description": "Rekenen met schaal, snelheid, plattegronden, mengsels en recepten.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": ["vermenigvuldigen_grote_getallen", "delen_zonder_rest"],
      "tiers": []
    },
    {
      "id": "meten_lengte_gewicht_inhoud",
      "name": "Meten: lengte, gewicht en inhoud",
      "category": "Meten",
      "domain": "meten",
      "description": "Rekenen met mm/cm/m/km, gram/kg, ml/liter en omrekenen tussen eenheden.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": ["getalbegrip_tot_100000"],
      "tiers": []
    },
    {
      "id": "meten_oppervlakte_omtrek",
      "name": "Oppervlakte en omtrek",
      "category": "Meten",
      "domain": "meten",
      "description": "Oppervlakte (cm²/m²) en omtrek berekenen.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": ["vermenigvuldigen_grote_getallen"],
      "tiers": []
    },
    {
      "id": "meetkunde_basis",
      "name": "Meetkunde",
      "category": "Meetkunde",
      "domain": "meetkunde",
      "description": "Ruimtelijk inzicht, vormen en symmetrie.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": [],
      "tiers": []
    }
  ]
};
