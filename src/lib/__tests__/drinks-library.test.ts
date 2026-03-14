import { describe, it, expect } from 'vitest';
import { drinksLibrary, getDrinksByCategory } from '../drinks-library';

describe('drinksLibrary', () => {
  it('all drinks have required fields: name, category, volume_ml, abv_percent', () => {
    drinksLibrary.forEach((drink) => {
      expect(drink.name).toBeTruthy();
      expect(drink.category).toBeTruthy();
      expect(drink.volume_ml).toBeGreaterThan(0);
      expect(drink.abv_percent).toBeGreaterThan(0);
    });
  });

  it('no drink has abv_percent of 0 or > 70', () => {
    drinksLibrary.forEach((drink) => {
      expect(drink.abv_percent).toBeGreaterThan(0);
      expect(drink.abv_percent).toBeLessThanOrEqual(70);
    });
  });

  it('no drink has volume_ml of 0 or > 2000', () => {
    drinksLibrary.forEach((drink) => {
      expect(drink.volume_ml).toBeGreaterThan(0);
      expect(drink.volume_ml).toBeLessThanOrEqual(2000);
    });
  });

  it('beer category has at least 4 drinks', () => {
    const beers = getDrinksByCategory('beer');
    expect(beers.length).toBeGreaterThanOrEqual(4);
  });

  it('all 6 categories have at least 1 drink', () => {
    expect(getDrinksByCategory('beer').length).toBeGreaterThan(0);
    expect(getDrinksByCategory('cider-seltzer').length).toBeGreaterThan(0);
    expect(getDrinksByCategory('wine').length).toBeGreaterThan(0);
    expect(getDrinksByCategory('sake-soju').length).toBeGreaterThan(0);
    expect(getDrinksByCategory('spirits').length).toBeGreaterThan(0);
    expect(getDrinksByCategory('cocktails').length).toBeGreaterThan(0);
  });

  it('first beer in the list is "Bottle of Lager"', () => {
    const beers = getDrinksByCategory('beer');
    expect(beers[0].name).toBe('Bottle of Lager');
  });

  it('all drink names are natural language (no parenthetical specs in the name)', () => {
    drinksLibrary.forEach((drink) => {
      expect(drink.name).not.toMatch(/\(/);
      expect(drink.name).not.toMatch(/\)/);
    });
  });
});
