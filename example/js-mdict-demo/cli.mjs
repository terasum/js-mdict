import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import { MDX } from "js-mdict";

program
  .argument('<path>')
  .argument('<word>');

program.parse();

// const options = program.opts();
const file_path = program.args[0];
const word = program.args[1];

let mdict_files = [];
if (fs.statSync(file_path).isDirectory()) {
  const tmp_files = fs.readdirSync(file_path, { recursive: true }).filter(file => {
    return file.endsWith('.mdx') || file.endsWith('.mdd');
  });

  tmp_files.map((item, index) => {
    mdict_files.push(path.join(file_path, item));
  });
} else {
  mdict_files.push(file_path);
}

console.log(mdict_files);


const out_path = path.resolve('output.txt');
const out_file = fs.createWriteStream(out_path, { flags: 'a' });

for (const mdict_file of mdict_files) {

  const mdict_path = path.resolve(mdict_file);
  console.log(`mdx/mdd file path: ${mdict_path}, word: ${word}`);

  if (!fs.existsSync(mdict_path)) {
    console.log(`mdx/mdd file path not exists`);
    process.exit(1);
  }



  const mdict = new MDX(mdict_path);
  const def = mdict.lookup(word);

  let line = "|";

  let single_file_path = mdict_path;
  single_file_path = single_file_path.split(/(\\|\/)/g).pop();
  console.log(single_file_path);

  console.log(mdict.header['Title']);
  console.log(mdict.header['GeneratedByEngineVersion']);
  console.log(mdict.header['Description']);

  line += single_file_path + "|";
  line += mdict.header['Title'] + "|";
  line += mdict.header['GeneratedByEngineVersion'] + "|";
  line += mdict.header['Encoding'] + "|";
  line += (def.definition ? def.definition.length : 0) + "|";
  line += "\n";

  out_file.write(line);

}


out_file.end();

