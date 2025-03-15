#!/usr/bin/env node
/* eslint-disable no-console */

//module/cli.js

import fs from 'fs';
import { MDX, MDD } from './index.js';

function help() {
  console.log('js-mdict - A MDict dictionary file reader command line tool');
  console.log('Usage:');
  console.log('js-mdict path/xxx.mdx yourword');
  console.log('Or:');
  console.log('js-mdict path/xxx.mdx your-resource-key');
}

/** Parse the command line */
const args = process.argv.slice(2);

// Validate input
if (args.length !== 2) {
  console.log('Error: Requires 2 arguments');
  help();
  process.exit();
}

const src = args[0];
const target = args[1];

if (!fs.existsSync(src)) {
  console.log("Error: Source mdx/mdd file doesn't exist. given: ", src);
  help();
  process.exit();
}

const file_extionsion = src.split('.').pop();
if (file_extionsion !== 'mdx' && file_extionsion !== 'mdd') {
  console.log('Error: Source file must be a mdx or mdd file');
  help();
  process.exit();
}

let result: { keyText: string; definition: null | string } = { keyText: '', definition: null };

switch (file_extionsion) {
  case 'mdx': {
    const mdx_dict = new MDX(src);
    const result = mdx_dict.lookup(target);
    if (result && result.definition) {
      console.log(result.definition);
    } else {
      console.log('not found');
    }
    break;
  }
  case 'mdd': {
    const mdd_dict = new MDD(src);
    result = mdd_dict.locate(target);
    if (result && result.definition) {
      if (result.definition.length > 100) {
        console.log(result.definition.slice(0, 100) + '...' + '(total: ' + result.definition.length/1024 + ' KB)');
      }
    } else {
      console.log('not found');
    }
    break;
  }
  default: {
    console.log('Error: Source file must be a mdx or mdd file');
  }
}
