import { describe, expect, it } from 'vitest';
import { Errand } from './errand';

const bank = { latitude: 6.4281, longitude: 3.4219, address: 'GTBank, Adeola Odeku' };
const shop = { latitude: 6.4433, longitude: 3.4796, address: 'Shoprite, Lekki' };
const home = { latitude: 6.4474, longitude: 3.4723, address: '22 Admiralty Way' };

describe('Errand builders', () => {
  it('build the same stages you could write by hand', () => {
    expect(Errand.queue(bank, { instructions: 'Collect the token', expectedMinutes: 30, maxMinutes: 90 })).toEqual({
      type: 'QUEUE',
      location: bank,
      instructions: 'Collect the token',
      expectedMinutes: 30,
      maxMinutes: 90,
    });
    expect(Errand.purchase(shop, [{ name: 'Peak milk 400g', quantity: 2, maxUnitPrice: 350_000 }], { spendLimit: 2_500_000, reference: 'groceries' })).toEqual({
      type: 'PURCHASE',
      location: shop,
      instructions: '',
      reference: 'groceries',
      spendLimit: 2_500_000,
      items: [{ name: 'Peak milk 400g', quantity: 2, maxUnitPrice: 350_000 }],
    });
    expect(Errand.dropoff(home, { contact: { name: 'Ada', phone: '+2348030000000' } })).toEqual({
      type: 'DROPOFF',
      location: home,
      instructions: '',
      contact: { name: 'Ada', phone: '+2348030000000' },
    });
  });

  it('put each type’s required fields where the API reads them', () => {
    expect(Errand.payment(bank, 'Eko Electricity', 1_500_000, { billReference: '0123456789' })).toMatchObject({
      type: 'PAYMENT',
      payee: 'Eko Electricity',
      amount: 1_500_000,
      billReference: '0123456789',
    });
    expect(Errand.inspection(shop, [{ type: 'PHOTO', text: 'The shelf' }])).toMatchObject({ type: 'INSPECTION', questions: [{ type: 'PHOTO', text: 'The shelf' }] });
    expect(Errand.custom(home, 'Hand the keys to the gateman', 'S')).toEqual({
      type: 'CUSTOM',
      location: home,
      instructions: 'Hand the keys to the gateman',
      effort: 'S',
    });
    expect(Errand.custom(home, 'Check the meter', 'M', { questions: [{ type: 'NUMBER', text: 'Reading' }] })).toMatchObject({
      effort: 'M',
      questions: [{ type: 'NUMBER', text: 'Reading' }],
    });
    expect(Errand.pickup(shop, [{ name: 'Parcel', quantity: 1 } as never])).toMatchObject({ type: 'PICKUP', items: [{ name: 'Parcel' }] });
  });
});
