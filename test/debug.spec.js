import { assert, expect } from "chai";
import Mdict from "../src/mdict";

function recorder(dictName, dictPath, func) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath, {
    passcode: "",
    debug: false,
    resort: true,
    isStripKey: true,
    isCaseSensitive: false,
  });
  console.log(mdict.lookup("hello"));
  /*
  { keyText: "hello",
    definition: "你好",
  }
  */
  console.log(mdict.prefix("hello"));
  /*
  [ { v: 64744840, k: 'he' },
  { v: 65513175, k: 'hell' },
  { v: 65552694, k: 'hello' } ]
  */

  const word = "hitch";
  const fws = mdict.fuzzy_search(word, 20, 5);
  console.log(fws);
  /*
 [ { key: 'history', rofset: 66627131, ed: 4 },
  { key: 'hit', rofset: 66648124, ed: 2 },
  { key: 'hit back', rofset: 66697464, ed: 4 },
  { key: 'hit back', rofset: 66697464, ed: 4 },
  { key: 'hit big', rofset: 66698789, ed: 4 },
  { key: 'hitch', rofset: 66698812, ed: 0 },
  { key: 'hitched', rofset: 66706586, ed: 2 },
  { key: 'hitcher', rofset: 66706602, ed: 2 },
  { key: 'hitches', rofset: 66706623, ed: 2 },
  { key: 'hitchhike', rofset: 66706639, ed: 4 },
  { key: 'hitchhiker', rofset: 66710697, ed: 5 },
  { key: 'hitching', rofset: 66712273, ed: 3 },
  { key: 'hi-tech', rofset: 66712289, ed: 2 },
  { key: 'hit for', rofset: 66713795, ed: 4 } ]

  */
  console.log(mdict.parse_def_record(fws[0]));

  const endTime = new Date().getTime();
  const elapsedTime = endTime - startTime;
  func(mdict, elapsedTime);
  // eslint-disable-next-line
  console.log(`loading ${dictName} dict used: ${elapsedTime / 1000.0} s`);
}

function debugSearch(dictName, dictPath, word, callback) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath, {
    passcode: "",
    debug: true,
    resort: true,
    isStripKey: true,
    isCaseSensitive: false,
  });
  const wordIndex = mdict.lookup(word);
  const endTime = new Date().getTime();
  console.log(
    `${dictName}: time costs ${endTime - startTime} ms, wordIndex ${wordIndex}`
  );
  callback(wordIndex);
}

function debugSearchCaseSensitive(dictName, dictPath, word, callback) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath, {
    debug: true,
    resort: true,
    isStripKey: true,
    isCaseSensitive: true,
  });
  const wordIndex = mdict.lookup(word);
  const endTime = new Date().getTime();
  console.log(
    `${dictName}: time costs ${endTime - startTime} ms, wordIndex ${wordIndex}`
  );
  callback(wordIndex);
}

function debugLoadResource(dictName, dictPath, word, callback) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath);
  const wordIndex = mdict.locate(word);
  const endTime = new Date().getTime();
  console.log(
    `${dictName}: time costs ${endTime - startTime} ms, wordIndex ${wordIndex}`
  );
  callback(wordIndex);
}

function debugStripKeyIgnoreCase(dictName, dictPath, word, callback) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath, {
    keyCaseSensitive: false,
    stripKey: true,
  });
  const stripfn = mdict._stripKeyOrIngoreCase();
  const strippedKey = stripfn(word);
  const endTime = new Date().getTime();
  console.log(
    `${dictName}: time costs ${
      endTime - startTime
    } ms, strippedKey: ${strippedKey}`
  );
  callback(strippedKey);
}

function debugNonStripKey(dictName, dictPath, word, callback) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath, {
    keyCaseSensitive: true,
    stripKey: false,
    resourceKey: true,
  });
  const stripfn = mdict._stripKeyOrIngoreCase();
  const strippedKey = stripfn(word);
  const endTime = new Date().getTime();
  console.log(
    `${dictName}: time costs ${
      endTime - startTime
    } ms, strippedKey: ${strippedKey}`
  );
  callback(strippedKey);
}

describe("MultDictionary", () => {
  describe("oale8.mdx", () => {
    it("#version", () => {
      // debug case 1:
      recorder("01-oale8", "mdx/testdict/oale8.mdx", (mdict) => {
        expect(mdict._version).to.be.equal(2);
      });
    });
  });

  describe("袖珍葡汉汉葡词典(简体版).mdx", () => {
    it("#Holanda", () => {
      // debug case 2
      // https://github.com/terasum/js-mdict/pull/27
      debugSearchCaseSensitive(
        "02-葡汉汉葡",
        "mdx/testdict/dict-01-袖珍葡汉汉葡词典(简体版).mdx",
        "Holanda",
        (def) => {
          console.log(def.definition);
          const expected =
            "<br><img src=file://11.gif>\r\n<p><font color=blue size=4>Holanda</font>\r\n<br> 荷兰(欧洲)\r\n\u0000";
          console.log(expected);
          assert.isTrue(def.definition === expected);
        }
      );
    });
    it("#holanda", () => {
      // debug case 3
      // https://github.com/terasum/js-mdict/pull/27
      debugSearchCaseSensitive(
        "03-葡汉汉葡",
        "mdx/testdict/dict-01-袖珍葡汉汉葡词典(简体版).mdx",
        "holanda",
        (def) => {
          console.log(def.definition);
          const expected =
            "<br><img src=file://11.gif>\r\n<p><font color=blue size=4>holanda</font>\r\n<br><font color=red> s.f. </font>\r\n<br> 洁白亚麻细布;荷兰麻布\r\n\u0000";
          console.log(expected);
          assert.isTrue(def.definition === expected);
        }
      );
    });
  });

  it("#stripKey", () => {
    // debug case 4
    // this dictionary is case sensitivy
    debugStripKeyIgnoreCase(
      "04-葡汉汉葡",
      "mdx/testdict/dict-01-袖珍葡汉汉葡词典(简体版).mdx",
      "Holanda",
      (strippedKey) => {
        assert.isTrue(strippedKey === "Holanda");
      }
    );
  });

  it("#stripKey", () => {
    // debug case 5
    // this dictionary is case sensitivy
    debugStripKeyIgnoreCase(
      "05-葡汉汉葡",
      "mdx/testdict/dict-01-袖珍葡汉汉葡词典(简体版).mdx",
      "holanda",
      (strippedKey) => {
        assert.isTrue(strippedKey === "holanda");
      }
    );
  });

  it("#stripKey", () => {
    // debug case 8
    debugStripKeyIgnoreCase(
      "08-葡汉汉葡",
      "mdx/testdict/dict-01-袖珍葡汉汉葡词典(简体版).mdx",
      "Hol anda",
      (strippedKey) => {
        assert.isTrue(strippedKey === "Holanda");
      }
    );
  });
});

describe("袖珍葡汉汉葡词典(简体版).mdx", () => {
  it("#大小写敏感", () => {
    // debug case 6
    debugStripKeyIgnoreCase(
      "06-大小写敏感",
      "mdx/testdict/dict-03-ptDict_KeyCaseSensitive.mdx",
      "Holanda",
      (strippedKey) => {
        assert.isTrue(strippedKey === "Holanda");
      }
    );
  });

  it("#大小写敏感", () => {
    // debug case 7
    debugSearchCaseSensitive(
      "07-大小写敏感",
      "mdx/testdict/dict-03-ptDict_KeyCaseSensitive.mdx",
      "Holanda",
      (def) => {
        console.log(def);
        assert.isTrue(def.keyText === "Holanda");
      }
    );
  });
});

describe("oale8.mdd", () => {
  it("#loadResource(1)", () => {
    debugNonStripKey(
      "09-oale8",
      "mdx/testdict/oale8.mdx",
      "/uk/headache__gb_1.mp3",
      (def) => {
        console.log(def);
      }
    );
  });

  it("#loadResource(2)", () => {
    debugLoadResource(
      "10-oale8",
      "mdx/testdict/oale8.mdd",
      "\\us_pron.png",
      (def) => {
        console.log(def.keyText);
        console.log(def.definition);
      }
    );
  });
});
