import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord } from '../lib/contentImport.js';

const NOW = new Date('2026-11-26T00:00:00Z');
const sources = [{ id: 'hisn-risala', name: 'حصن المسلم', domain: 'risala.prh.gov.sa', domainStatus: 'verified-by-fetch' }];
const base = {
  id: 'x-v1', targetId: 'x', kind: 'dhikr', arabicText: 'نص', reference: 'مرجع', sourceId: 'hisn-risala',
  sourceUrl: 'https://risala.prh.gov.sa/ar/content/51', method: 'manual-copy', fetchedAt: '2026-11-25T10:00:00Z',
  importedBy: 'hisn-source-extraction', countNote: '', transcriptionNote: '',
};
const review = { recordId: 'x-v1', reviewer: 'مراجع', reviewedAt: '2026-11-25T11:00:00Z',
  checks: { textMatchesOriginal: true, referenceConfirmed: true, sourceUrlOpened: true, rightsReviewed: true }, scope: 's', note: 'n' };

test('count null is accepted for dhikr (no-count card)', () => {
  const r = validateRecord({ ...base, count: null }, sources, [review], NOW);
  assert.equal(r.ok, true, JSON.stringify(r.reasons));
});

test('integer count still required when not null', () => {
  for (const bad of [0, -1, 1.5, '3', undefined]) {
    const r = validateRecord({ ...base, count: bad }, sources, [review], NOW);
    assert.equal(r.ok, false, `count ${String(bad)} should fail`);
  }
  assert.equal(validateRecord({ ...base, count: 1 }, sources, [review], NOW).ok, true);
});
