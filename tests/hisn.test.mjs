import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AZKAR_SECTIONS} from '../lib/azkarData.js';
import records from '../content/records/index.json' with {type:'json'};
import reviews from '../content/review-log.json' with {type:'json'};
import source from '../content/hisn-source-selection.json' with {type:'json'};

test('Hisn only: the original 11 records still match the reviewed snapshot',()=>{
 assert.equal(records.length,28);
 assert.deepEqual(records.slice(0,11),source.records);
 assert.ok(records.every(r=>r.sourceId==='hisn-risala'));
 assert.ok(records.slice(0,11).every(r=>reviews.some(v=>v.recordId===r.id&&v.scope==='private-local-review-only')));
});
test('Batch 2 records have an independent review that is not the importer, with all checks true',()=>{
 const batch=records.slice(11,15);
 assert.equal(batch.length,4);
 for(const r of batch){
  const v=reviews.find(x=>x.recordId===r.id);
  assert.ok(v, r.id);
  assert.notEqual(v.reviewer,r.importedBy);
  assert.ok(Object.values(v.checks).every(c=>c===true), r.id);
 }
});
test('Printed repetition and continuation boundaries follow book-relative order',()=>{
 const ids=AZKAR_SECTIONS.map(s=>s.itemIds.filter(id=>records.some(r=>r.targetId===id)));
 assert.deepEqual(ids,[['ap-1','ap-2','ap-3','ap-5','ap-4','ap-tasbih-33','ap-ibnmajah-fajr-925','ap-muawwidhat','ap-ayat-kursi'],['ms-ikhlas-3','ms-falaq-3','ms-nas-3','ms-asbahna-2723','m-2','ms-sayyid-1','m-3','m-1','ms-ashhadk-4-m','ms-afini-3','ms-hasbiya-7','ms-afw-1','ms-radeet-3','ms-tahlil-100-sabah','ms-khalqihi-3-m','ms-istighfar-100'],['ms-ikhlas-3','ms-falaq-3','ms-nas-3','e-2','ms-sayyid-1','e-3','e-1','ms-afini-3','ms-hasbiya-7','ms-afw-1','ms-radeet-3','ms-istighfar-100']]);
 assert.equal(records.find(r=>r.targetId==='ap-3').count,3);
 assert.equal(records.find(r=>r.targetId==='ap-5').count,1);
 assert.match(records.find(r=>r.targetId==='e-2').countNote,/متن الكتاب/);
});
test('Revised text uses new counters without deleting prior local data',()=>{
 const ui=readFileSync(new URL('../components/AzkarTab.tsx',import.meta.url),'utf8');
 assert.match(ui,/azkar:hisn-v1:/);
 assert.doesNotMatch(ui,/localStorage\.clear/);
});

test('Primary references cover every selected item and distinguish Al-Adab Al-Mufrad',async()=>{
 const {default:refs}=await import('../content/primary-references.json',{with:{type:'json'}});
 assert.deepEqual(Object.keys(refs).sort(),records.map(r=>r.targetId).sort());
 for(const [key,ref] of Object.entries(refs)) assert.equal(new URL(ref.url).hostname, key==='ap-ayat-kursi' ? 'dorar.net' : 'sunnah.com');
 assert.match(refs['e-2'].label,/الأدب المفرد/);
 assert.doesNotMatch(refs['e-2'].label,/صحيح البخاري|الترمذي/);
 assert.match(refs['ap-2'].label,/592/);
 assert.match(refs['ap-3'].url,/6473/);
});
