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
      "domain": "getallen",
      "description": "Grote getallen vergelijken, ordenen en afronden.",
      "exerciseType": "getalbegrip",
      "implemented": true,
      "prerequisites": [],
      "tiers": [
        {
          "tier": 1,
          "max": 1000
        },
        {
          "tier": 2,
          "max": 10000
        },
        {
          "tier": 3,
          "max": 50000
        },
        {
          "tier": 4,
          "max": 100000
        },
        {
          "tier": 5,
          "max": 100000
        }
      ]
    },
    {
      "id": "optellen_tot_100000",
      "name": "Optellen tot 100.000",
      "domain": "bewerkingen",
      "description": "Optellen met grotere getallen, ook kolomsgewijs.",
      "exerciseType": "optellen",
      "implemented": true,
      "prerequisites": [
        "getalbegrip_tot_100000"
      ],
      "tiers": [
        {
          "tier": 1,
          "min": 1,
          "max": 100
        },
        {
          "tier": 2,
          "min": 10,
          "max": 1000
        },
        {
          "tier": 3,
          "min": 100,
          "max": 10000
        },
        {
          "tier": 4,
          "min": 1000,
          "max": 100000
        },
        {
          "tier": 5,
          "min": 1000,
          "max": 100000
        }
      ]
    },
    {
      "id": "aftrekken_tot_100000",
      "name": "Aftrekken tot 100.000",
      "domain": "bewerkingen",
      "description": "Aftrekken met grotere getallen, ook kolomsgewijs.",
      "exerciseType": "aftrekken",
      "implemented": true,
      "prerequisites": [
        "getalbegrip_tot_100000"
      ],
      "tiers": [
        {
          "tier": 1,
          "min": 1,
          "max": 100
        },
        {
          "tier": 2,
          "min": 10,
          "max": 1000
        },
        {
          "tier": 3,
          "min": 100,
          "max": 10000
        },
        {
          "tier": 4,
          "min": 1000,
          "max": 100000
        },
        {
          "tier": 5,
          "min": 1000,
          "max": 100000
        }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_6",
      "name": "Tafel van 6",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 6.",
      "exerciseType": "tafel",
      "table": 6,
      "implemented": true,
      "prerequisites": [],
      "tiers": [
        {
          "tier": 1,
          "multiplierMax": 5
        },
        {
          "tier": 2,
          "multiplierMax": 10
        },
        {
          "tier": 3,
          "multiplierMax": 10,
          "askMissingFactor": true
        },
        {
          "tier": 4,
          "multiplierMax": 12
        },
        {
          "tier": 5,
          "multiplierMax": 12,
          "askMissingFactor": true
        }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_7",
      "name": "Tafel van 7",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 7.",
      "exerciseType": "tafel",
      "table": 7,
      "implemented": true,
      "prerequisites": [],
      "tiers": [
        {
          "tier": 1,
          "multiplierMax": 5
        },
        {
          "tier": 2,
          "multiplierMax": 10
        },
        {
          "tier": 3,
          "multiplierMax": 10,
          "askMissingFactor": true
        },
        {
          "tier": 4,
          "multiplierMax": 12
        },
        {
          "tier": 5,
          "multiplierMax": 12,
          "askMissingFactor": true
        }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_8",
      "name": "Tafel van 8",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 8.",
      "exerciseType": "tafel",
      "table": 8,
      "implemented": true,
      "prerequisites": [],
      "tiers": [
        {
          "tier": 1,
          "multiplierMax": 5
        },
        {
          "tier": 2,
          "multiplierMax": 10
        },
        {
          "tier": 3,
          "multiplierMax": 10,
          "askMissingFactor": true
        },
        {
          "tier": 4,
          "multiplierMax": 12
        },
        {
          "tier": 5,
          "multiplierMax": 12,
          "askMissingFactor": true
        }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_9",
      "name": "Tafel van 9",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 9.",
      "exerciseType": "tafel",
      "table": 9,
      "implemented": true,
      "prerequisites": [],
      "tiers": [
        {
          "tier": 1,
          "multiplierMax": 5
        },
        {
          "tier": 2,
          "multiplierMax": 10
        },
        {
          "tier": 3,
          "multiplierMax": 10,
          "askMissingFactor": true
        },
        {
          "tier": 4,
          "multiplierMax": 12
        },
        {
          "tier": 5,
          "multiplierMax": 12,
          "askMissingFactor": true
        }
      ]
    },
    {
      "id": "vermenigvuldigen_tafel_10",
      "name": "Tafel van 10",
      "domain": "bewerkingen",
      "description": "Automatiseren van de tafel van 10.",
      "exerciseType": "tafel",
      "table": 10,
      "implemented": true,
      "prerequisites": [],
      "tiers": [
        {
          "tier": 1,
          "multiplierMax": 5
        },
        {
          "tier": 2,
          "multiplierMax": 10
        },
        {
          "tier": 3,
          "multiplierMax": 10,
          "askMissingFactor": true
        },
        {
          "tier": 4,
          "multiplierMax": 12
        },
        {
          "tier": 5,
          "multiplierMax": 12,
          "askMissingFactor": true
        }
      ]
    },
    {
      "id": "vermenigvuldigen_grote_getallen",
      "name": "Vermenigvuldigen met grotere getallen",
      "domain": "bewerkingen",
      "description": "Een getal van twee cijfers keer een getal van één cijfer.",
      "exerciseType": "vermenigvuldigen_groot",
      "implemented": true,
      "prerequisites": [
        "vermenigvuldigen_tafel_6",
        "vermenigvuldigen_tafel_7",
        "vermenigvuldigen_tafel_8",
        "vermenigvuldigen_tafel_9"
      ],
      "tiers": [
        {
          "tier": 1,
          "factor1Max": 20,
          "factor2Max": 5
        },
        {
          "tier": 2,
          "factor1Max": 50,
          "factor2Max": 7
        },
        {
          "tier": 3,
          "factor1Max": 99,
          "factor2Max": 9
        },
        {
          "tier": 4,
          "factor1Max": 99,
          "factor2Max": 9
        },
        {
          "tier": 5,
          "factor1Max": 99,
          "factor2Max": 12
        }
      ]
    },
    {
      "id": "delen_zonder_rest",
      "name": "Delen zonder rest",
      "domain": "bewerkingen",
      "description": "Deelsommen die precies uitkomen.",
      "exerciseType": "delen_zonder_rest",
      "implemented": true,
      "prerequisites": [
        "vermenigvuldigen_tafel_6",
        "vermenigvuldigen_tafel_7",
        "vermenigvuldigen_tafel_8",
        "vermenigvuldigen_tafel_9"
      ],
      "tiers": [
        {
          "tier": 1,
          "divisorMax": 5,
          "quotientMax": 10
        },
        {
          "tier": 2,
          "divisorMax": 10,
          "quotientMax": 10
        },
        {
          "tier": 3,
          "divisorMax": 10,
          "quotientMax": 20
        },
        {
          "tier": 4,
          "divisorMax": 12,
          "quotientMax": 25
        },
        {
          "tier": 5,
          "divisorMax": 12,
          "quotientMax": 50
        }
      ]
    },
    {
      "id": "delen_met_rest",
      "name": "Delen met rest",
      "domain": "bewerkingen",
      "description": "Deelsommen waar een rest overblijft.",
      "exerciseType": "delen_met_rest",
      "implemented": true,
      "prerequisites": [
        "delen_zonder_rest"
      ],
      "tiers": [
        {
          "tier": 1,
          "divisorMax": 5,
          "quotientMax": 8
        },
        {
          "tier": 2,
          "divisorMax": 8,
          "quotientMax": 10
        },
        {
          "tier": 3,
          "divisorMax": 10,
          "quotientMax": 12
        },
        {
          "tier": 4,
          "divisorMax": 10,
          "quotientMax": 20
        },
        {
          "tier": 5,
          "divisorMax": 12,
          "quotientMax": 25
        }
      ]
    },
    {
      "id": "verhaalsom_basisbewerkingen",
      "name": "Verhaalsommen",
      "domain": "verhaalsommen",
      "description": "Rekenverhalen met optellen, aftrekken, vermenigvuldigen en delen.",
      "exerciseType": "verhaalsom",
      "implemented": true,
      "prerequisites": [
        "optellen_tot_100000",
        "aftrekken_tot_100000",
        "vermenigvuldigen_grote_getallen",
        "delen_zonder_rest"
      ],
      "tiers": [
        {
          "tier": 1,
          "max": 100
        },
        {
          "tier": 2,
          "max": 500
        },
        {
          "tier": 3,
          "max": 1000
        },
        {
          "tier": 4,
          "max": 5000
        },
        {
          "tier": 5,
          "max": 10000
        }
      ]
    },
    {
      "id": "breuken_basis",
      "name": "Breuken herkennen en vergelijken",
      "domain": "breuken",
      "description": "Helften, derde, kwarten, vijfde en tiende delen; vergelijken en vereenvoudigen.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": [
        "getalbegrip_tot_100000"
      ],
      "tiers": []
    },
    {
      "id": "breuken_kommagetallen",
      "name": "Beginnende decimalen (kommagetallen)",
      "domain": "breuken",
      "description": "Kommagetallen lezen, plaatsen op de getallenlijn.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": [
        "breuken_basis"
      ],
      "tiers": []
    },
    {
      "id": "verhoudingen_schaal",
      "name": "Verhoudingen: schaal en snelheid",
      "domain": "verhoudingen",
      "description": "Rekenen met schaal, snelheid, plattegronden, mengsels en recepten.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": [
        "vermenigvuldigen_grote_getallen",
        "delen_zonder_rest"
      ],
      "tiers": []
    },
    {
      "id": "meten_lengte_gewicht_inhoud",
      "name": "Meten: lengte, gewicht en inhoud",
      "domain": "meten",
      "description": "Rekenen met mm/cm/m/km, gram/kg, ml/liter en omrekenen tussen eenheden.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": [
        "getalbegrip_tot_100000"
      ],
      "tiers": []
    },
    {
      "id": "meten_oppervlakte_omtrek",
      "name": "Oppervlakte en omtrek",
      "domain": "meten",
      "description": "Oppervlakte (cm²/m²) en omtrek berekenen.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": [
        "vermenigvuldigen_grote_getallen"
      ],
      "tiers": []
    },
    {
      "id": "meetkunde_basis",
      "name": "Meetkunde",
      "domain": "meetkunde",
      "description": "Ruimtelijk inzicht, vormen en symmetrie.",
      "exerciseType": null,
      "implemented": false,
      "prerequisites": [],
      "tiers": []
    }
  ]
};
