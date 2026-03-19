import { MDX } from '../dist/esm/index.js';
import { MDD } from '../dist/esm/mdd.js';
import fs from 'fs';
import path from 'path';

const mdxPath = './tests/data/ode_3e_test/Oxford Dictionary of English 3e.mdx';
const mddPath = './tests/data/ode_3e_test/Oxford Dictionary of English 3e.mdd';

console.log('=== Testing with Oxford Dictionary of English 3e (MDX + MDD) ===\n');

// 1. MDX Test
console.log('Loading MDX...');
const mdx = new MDX(mdxPath);
console.log('MDX loaded. Total keywords:', mdx.keywordList.length);

const word = 'apple';
const entry = mdx.lookup(word);
console.log(`\nLookup "${word}":`, entry.definition?.substring(0, 150) + '...');

// 2. MDD Test (Issue 80)
console.log('\nLoading MDD...');
const mdd = new MDD(mddPath);
console.log('MDD loaded. Total resources:', mdd.keywordList.length);

// Try to find an image or sound resource
// Usually resources start with \ or /
const resources = mdd.keywordList.slice(0, 10).map(item => item.keyText);
console.log('\nSample resources in MDD:', resources);

// Find a specific resource if possible
const targetResource = mdd.keywordList.find(item => item.keyText.toLowerCase().includes('.jpg') || item.keyText.toLowerCase().includes('.png'));

if (targetResource) {
    console.log(`\nTesting Issue 80: Fetching resource "${targetResource.keyText}"`);
    const data = mdd.locate(targetResource.keyText);
    if (data && data.definition) {
        console.log(`Success! Resource data size: ${data.definition.length} bytes`);
    } else {
        console.log('Failed to fetch resource data.');
    }
} else {
    console.log('\nNo image resources found in the first batch of MDD.');
}

console.log('\n=== MDD Tests completed ===');
