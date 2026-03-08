import { DrinkCategory, LibraryDrink } from '@/types';

// WHO standard unit: 10ml pure alcohol
// units = (volume_ml * abv_percent / 100) / 10
function u(vol: number, abv: number) {
  return Math.round(((vol * abv) / 100 / 10) * 10) / 10;
}

export const drinksLibrary: LibraryDrink[] = [
  // Beer
  { id: 'beer-pint-4', name: 'Pint — Regular (4%)', category: 'beer', volume_ml: 568, abv_percent: 4, units: u(568, 4) },
  { id: 'beer-pint-5', name: 'Pint — Strong (5%)', category: 'beer', volume_ml: 568, abv_percent: 5, units: u(568, 5) },
  { id: 'beer-stubby', name: 'Bottle / Stubby (330ml, 5%)', category: 'beer', volume_ml: 330, abv_percent: 5, units: u(330, 5) },
  { id: 'beer-can', name: 'Can (375ml, 4.5%)', category: 'beer', volume_ml: 375, abv_percent: 4.5, units: u(375, 4.5) },
  { id: 'beer-schooner', name: 'Schooner (425ml, 4.5%)', category: 'beer', volume_ml: 425, abv_percent: 4.5, units: u(425, 4.5) },
  { id: 'beer-middy', name: 'Middy / Pot (285ml, 4.5%)', category: 'beer', volume_ml: 285, abv_percent: 4.5, units: u(285, 4.5) },

  // Wine
  { id: 'wine-small', name: 'Small Glass (125ml, 12%)', category: 'wine', volume_ml: 125, abv_percent: 12, units: u(125, 12) },
  { id: 'wine-standard', name: 'Standard Glass (175ml, 12%)', category: 'wine', volume_ml: 175, abv_percent: 12, units: u(175, 12) },
  { id: 'wine-large', name: 'Large Glass (250ml, 12%)', category: 'wine', volume_ml: 250, abv_percent: 12, units: u(250, 12) },
  { id: 'wine-bottle', name: 'Bottle (750ml, 12%)', category: 'wine', volume_ml: 750, abv_percent: 12, units: u(750, 12) },
  { id: 'wine-prosecco', name: 'Prosecco Flute (125ml, 11%)', category: 'wine', volume_ml: 125, abv_percent: 11, units: u(125, 11) },
  { id: 'wine-rose', name: 'Rosé Glass (175ml, 11.5%)', category: 'wine', volume_ml: 175, abv_percent: 11.5, units: u(175, 11.5) },

  // Spirits
  { id: 'spirits-single', name: 'Single Shot (25ml, 40%)', category: 'spirits', volume_ml: 25, abv_percent: 40, units: u(25, 40) },
  { id: 'spirits-double', name: 'Double Shot (50ml, 40%)', category: 'spirits', volume_ml: 50, abv_percent: 40, units: u(50, 40) },
  { id: 'spirits-nip', name: 'Nip / Measure (30ml, 40%)', category: 'spirits', volume_ml: 30, abv_percent: 40, units: u(30, 40) },
  { id: 'spirits-cocktail', name: 'Cocktail (approx 2 shots)', category: 'spirits', volume_ml: 60, abv_percent: 35, units: u(60, 35) },
  { id: 'spirits-long', name: 'Long Drink / Highball', category: 'spirits', volume_ml: 50, abv_percent: 40, units: u(50, 40) },
  { id: 'spirits-liqueur', name: 'Liqueur (50ml, 20%)', category: 'spirits', volume_ml: 50, abv_percent: 20, units: u(50, 20) },

  // Cider
  { id: 'cider-pint', name: 'Pint — Cider (4.5%)', category: 'cider', volume_ml: 568, abv_percent: 4.5, units: u(568, 4.5) },
  { id: 'cider-can', name: 'Can (440ml, 5%)', category: 'cider', volume_ml: 440, abv_percent: 5, units: u(440, 5) },
  { id: 'cider-bottle', name: 'Bottle (330ml, 4.5%)', category: 'cider', volume_ml: 330, abv_percent: 4.5, units: u(330, 4.5) },
  { id: 'cider-strong', name: 'Strong Cider (500ml, 7%)', category: 'cider', volume_ml: 500, abv_percent: 7, units: u(500, 7) },

  // Other
  { id: 'other-seltzer', name: 'Hard Seltzer (330ml, 5%)', category: 'other', volume_ml: 330, abv_percent: 5, units: u(330, 5) },
  { id: 'other-alcopop', name: 'Alcopop / RTD (275ml, 4%)', category: 'other', volume_ml: 275, abv_percent: 4, units: u(275, 4) },
];

export function getDrinksByCategory(category: DrinkCategory): LibraryDrink[] {
  return drinksLibrary.filter((d) => d.category === category);
}
