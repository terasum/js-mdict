import path from "path";
import Benchmark from "benchmark";
import Parser from "../src/parser";


(() => {
  const parser = new Parser(path.join(__dirname, "../resource/ETDict.mdx"));
  const buf = parser.buffer();

  buf.then((resolve) => {
    console.log(resolve);
  }).catch((err) => {
    throw err;
  });

  const suite = new Benchmark.Suite();
  suite.add("Paser#buffer", () => {
    buf.then(buff => buff.size > 0);
  })
  // add listeners
    .on("cycle", (event) => {
      console.log(String(event.target));
    })
    .on("complete", function () {
      console.log(`Fastest is ${this.filter("fastest").map("name")}`);
    })
  // run async
    .run({ async: true });
})();
