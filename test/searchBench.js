import { Benchmark } from "benchmark";

import Mdict from "../src";

const suite = new Benchmark.Suite();

// loading dictionary
const startTime = new Date().getSeconds();
const mdict = new Mdict("mdx/oale8.mdx");
const endTime = new Date().getSeconds();
console.log(`Mdict#loading time: ${(endTime - startTime)} sec`);


// add tests
suite
  .add("Mdict#lookup", () => {
    mdict.lookup("incited");
  })
  .add("Mdict#bsearch", () => {
    mdict.bsearch("incited");
  })
  .add("Mdict#fuzzySearch", () => {
    mdict.fuzzy_search("wrapper", 5);
  })
  .add("Mdict#prefix", () => {
    mdict.prefix("inc");
  })
// add listeners
  .on("cycle", (event) => {
    // eslint-disable-next-line no-console
    console.log(String(event.target));
  })
  .on("complete", function cb() {
    // eslint-disable-next-line no-console
    console.log(`Fastest is ${this.filter("fastest").map("name")}`);
  })
// run async
  .run({ async: true });
