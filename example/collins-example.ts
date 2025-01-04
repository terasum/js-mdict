import {MDD} from '../dist/cjs/index.js';

const mdd = new MDD('./tests/data/Collins.mdd');
console.log(mdd.header);
console.log(mdd.locate('\\Logo.jpg'));

/*
$ git clone github.com/terasum/js-mdict
$ cd js-mdict
$ npx tsx ./example/collins-example.ts
{
  GeneratedByEngineVersion: '2.0',
  RequiredEngineVersion: '2.0',
  Format: '',
  KeyCaseSensitive: 'No',
  StripKey: 'No',
  Encrypted: '2',
  RegisterBy: 'EMail',
  Description: '<font size=5 color=red>《柯林斯COBUILD高阶英汉双解学习词典》（Collins COBUILD Advanced Learner&apos;s English-Chinese Dictionary）是柯林斯公司携手外研社为中国学习者量身定制的全新版本，突出强调了学习型词典的学习功能，同时在可读性和易用性方面均有大幅提升。</font>',
  Title: '柯林斯高阶英汉双解学习词典',
  Encoding: '',
  CreationDate: '2012-5-29'
}
{
  keyText: '\\Logo.jpg',
  definition: '77u/QGNoYXJzZX... 24704 more characters'
}
    */
