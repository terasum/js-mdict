/**
 * Test script for Issue #86 - Duplicate key handling
 * This simulates a dictionary with duplicate keys to verify lookupAll() behavior
 */

// Mock MDX class for testing duplicate key scenario
class MockMDX {
  constructor() {
    // Simulate keyword list with duplicates (like Issue #86)
    // tyre appears 3 times: main entry, image, and link
    this.keywordList = [
      { keyText: 'turn', recordStartOffset: 100, recordEndOffset: 200, keyBlockIdx: 0 },
      { keyText: 'tyre', recordStartOffset: 200, recordEndOffset: 300, keyBlockIdx: 0 }, // Image
      { keyText: 'tyre', recordStartOffset: 300, recordEndOffset: 400, keyBlockIdx: 0 }, // Main entry
      { keyText: 'tyre', recordStartOffset: 400, recordEndOffset: 500, keyBlockIdx: 0 }, // Link to tire
      { keyText: 'umbrella', recordStartOffset: 500, recordEndOffset: 600, keyBlockIdx: 0 },
    ];
    
    // Mock definitions
    this.definitions = {
      200: '[IMAGE DATA: ldoce490jpg]',
      300: '<div>tyre: a rubber ring that fits around the wheel of a car...</div>',
      400: '@@@LINK=tire'
    };
  }

  // Mock comparison function (case-insensitive)
  comp(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  }

  // Original lookup method (returns first match only)
  lookup(word) {
    const item = this.keywordList.find(item => this.comp(item.keyText, word) === 0);
    if (!item) {
      return { keyText: word, definition: null };
    }
    return {
      keyText: word,
      definition: this.definitions[item.recordStartOffset] || null
    };
  }

  // New lookupAll method (returns ALL matches)
  lookupAll(word) {
    const matchedItems = this.keywordList.filter(item => {
      return this.comp(item.keyText, word) === 0;
    });

    return matchedItems.map(item => ({
      keyText: item.keyText,
      definition: this.definitions[item.recordStartOffset] || null
    }));
  }
}

// Run tests
console.log('=== Testing Issue #86 - Duplicate Key Handling ===\n');

const mdx = new MockMDX();

console.log('Test 1: Original lookup() - returns first match only');
const singleResult = mdx.lookup('tyre');
console.log('Result:', singleResult);
console.log('Definition:', singleResult.definition);
console.log('❌ Problem: Returns image data, not main entry!\n');

console.log('Test 2: New lookupAll() - returns all matches');
const allResults = mdx.lookupAll('tyre');
console.log(`Found ${allResults.length} entries for "tyre":`);
allResults.forEach((result, index) => {
  console.log(`  [${index + 1}] ${result.definition.substring(0, 50)}...`);
});

console.log('\n✅ Solution: User can filter results:');
const mainEntry = allResults.find(r => !r.definition.startsWith('[IMAGE') && !r.definition.startsWith('@@@LINK'));
console.log('Main entry found:', mainEntry?.definition.substring(0, 60) + '...');

// Validation
console.log('\n=== Validation ===');
const passed = allResults.length === 3 && 
               allResults[0].definition.includes('IMAGE') &&
               allResults[1].definition.includes('rubber ring');

if (passed) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Tests failed!');
  process.exit(1);
}
