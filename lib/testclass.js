"use strict";

// 定义类
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  toString() {
    return `( ${this.x},  ${this.y} )`;
  }
}

module.exports = Point;