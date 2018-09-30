import { Benchmark } from "benchmark";

import Mdict from "../src";

const suite = new Benchmark.Suite();

// loading dictionary
const mdict = new Mdict("mdx/oale8.mdx");
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
  .on("complete", () => {
    // eslint-disable-next-line no-console
    console.log(`Fastest is ${this.filter("fastest").map("name")}`);
  })
// run async
  .run({ async: true });
