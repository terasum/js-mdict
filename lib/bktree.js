"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function triple_min(a, b, c) {
  const temp = a < b ? a : b;
  return temp < c ? temp : c;
}

// Damerau–Levenshtein distance  implemention
// ref: https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
function edit_distance(a, b) {
  // create a 2 dimensions array
  const m = a.length;
  const n = b.length;
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1);
  }

  // init dp array
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // dynamic approach
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] !== b[j - 1]) {
        dp[i][j] = triple_min(1 + dp[i - 1][j], // deletion
        1 + dp[i][j - 1], // insertion
        1 + dp[i - 1][j - 1] // replacement
        );
      } else {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  return dp[m][n];
}

// console.log(edit_distance("halleaa", "hello"));

// ----------------------------
// BK-tree Node definition
// ----------------------------

// Maxium word length
const LEN = 100;

function BKNode(w) {
  this.word = w;
  this.next = new Array(2 * LEN);
  for (let i = 0; i < 2 * LEN; i++) {
    this.next[i] = -1;
  }
}

BKNode.prototype.set_word = function set_word(w) {
  this.word = w;
};

class BKTree {
  constructor(word_num) {
    this.tree = new Array(word_num);
    for (let i = 0; i < this.tree.length; i++) {
      this.tree[i] = new BKNode("");
    }
    this.rt = new BKNode("");
    this.ptr = 0;
  }
  _add(idx, curr) {
    if (this.rt.word === "") {
      this.rt.set_word(curr.word);
      this.tree[0] = this.rt;
      return;
    }
    const dist = edit_distance(this.rt.word, curr.word);
    // console.log(this.rt.word, idx, dist);
    // throw Error("stop");
    if (this.tree[idx].next[dist] === -1) {
      /* if no Node exists at this dist from root
      * make it child of root Node */

      // incrementing the pointer for curr Node
      this.ptr++;

      this.tree[this.ptr].set_word(curr.word);

      // curr as child of root Node
      this.tree[idx].next[dist] = this.ptr;
    } else {
      // recursively find the parent for curr Node
      this._add(this.tree[idx].next[dist], curr);
    }
  }
  _sim_words(idx, word, TOL) {
    let ret = [];
    if (idx === -1) {
      return ret;
    }

    if (this.rt.word === "") {
      return ret;
    }
    const cur_rt = this.tree[idx];

    // calculating editdistance of s from root
    const dist = edit_distance(word, cur_rt.word);
    // if dist is less than tolerance value
    // add it to similar words
    if (dist <= TOL) {
      ret.push(cur_rt.word);
    }

    let start = dist - TOL;
    if (start < 0) {
      start = 1;
    }
    const end = dist + TOL;
    while (start < end) {
      const temp = this._sim_words(cur_rt.next[start], word, TOL);
      ret = ret.concat(temp);
      start++;
    }
    return ret;
  }
  add(words) {
    if (!Array.isArray(words)) {
      throw new Error("words is not array");
    }
    words.forEach(element => {
      this._add(0, new BKNode(element));
    });
  }

  simWords(src, TOL) {
    return this._sim_words(0, src, TOL);
  }
}

exports.default = BKTree;