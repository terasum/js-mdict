import { linenumber } from "@everymundo/linenumber";

const DEBUG = (...args) => console.log(__filename, linenumber(), args);
