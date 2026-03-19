import { MDX } from '../dist/esm/index.js';

const mdxPath = './tests/data/ncecd_test/xinshiji_eng_chin_dict.mdx';

console.log('=== Testing with 新世纪英汉大词典 ===\n');
console.log('Loading dictionary...');

const mdict = new MDX(mdxPath);

console.log('Dictionary loaded successfully!');
console.log(`Total keywords: ${mdict.keywordList.length}`);

// Test 1: Lookup a common word
console.log('\n--- Test 1: lookup() ---');
const result1 = mdict.lookup('hello');
console.log(`lookup("hello"):`, result1.definition?.substring(0, 100) + '...');

// Test 2: lookupAll() - check for duplicate keys (Issue 86)
console.log('\n--- Test 2: lookupAll() (Relates to Issue 86) ---');
const results2 = mdict.lookupAll('hello');
console.log(`lookupAll("hello"): Found ${results2.length} entries`);
results2.forEach((res, i) => {
    console.log(`Entry ${i+1}: ${res.definition?.substring(0, 50)}...`);
});

// Test 3: contains() - substring search (Issue 85)
console.log('\n--- Test 3: contains() (Relates to Issue 85) ---');
const results3 = mdict.contains('tion', false, 10);
console.log(`contains("tion", false, 10): Found ${results3.length} words`);
console.log('First 5 words:', results3.slice(0, 5).map(w => w.keyText));

// Test 4: prefix() - prefix search
console.log('\n--- Test 4: prefix() ---');
const results4 = mdict.prefix('book');
console.log(`prefix("book"): Found ${results4.length} words`);
console.log('First 5 words:', results4.slice(0, 5).map(w => w.keyText));

console.log('\n=== Tests completed ===');
