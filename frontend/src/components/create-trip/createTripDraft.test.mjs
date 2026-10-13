import assert from 'node:assert/strict';
import test from 'node:test';
import { readCreateTripDraft, saveCreateTripDraft } from './createTripDraft.ts';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('create-trip draft is stored per account and rejects malformed data', () => {
  const storage = memoryStorage();
  const draft = {
    destination: 'hue', startDate: '2026-11-01', endDate: '2026-11-03',
    budget: { min: 1000000, max: 5000000 }, people: 2, pace: 'normal',
    notes: 'Đi Huế', selectedAllergies: ['đậu phộng'], travelDna: [],
    originalTravelDna: [], travelDnaAnalysisId: 'analysis-1',
    attachments: [{ id: 'image-1', name: 'inspiration.png', imageUrl: 'https://res.cloudinary.com/demo/image.png' }],
  };

  saveCreateTripDraft(storage, 'user/a', draft);
  assert.deepEqual(readCreateTripDraft(storage, 'user/a'), draft);
  assert.equal(readCreateTripDraft(storage, 'user-b'), null);

  storage.setItem('vistra:create-trip:return-draft:v1:user%2Fa', '{broken');
  assert.equal(readCreateTripDraft(storage, 'user/a'), null);
  assert.equal(storage.getItem('vistra:create-trip:return-draft:v1:user%2Fa'), null);

  saveCreateTripDraft(storage, 'user/a', { ...draft, attachments: [{ ...draft.attachments[0], imageUrl: 'javascript:alert(1)' }] });
  assert.equal(readCreateTripDraft(storage, 'user/a'), null);
});
