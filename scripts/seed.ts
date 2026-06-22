import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/demo-data";

seedDemoData(db, { reset: true });

console.log("Banco SQLite populado com dados de demonstracao.");
