// import app, { PORT, DUMMY } from "./src/app";

import app from "./src/app";
// importing same variable
import { PORT as API_PORT } from "./src/configs/constant";
import { connectToMongoDB } from "./src/database/mongodb";

connectToMongoDB();

const processId = process.pid;
const startupTimestamp = new Date().toISOString();
const uniqueId = `${startupTimestamp}-${processId}`;

app.listen(
  API_PORT, // start backend in this PORT
  () => {
    console.log(`========================================`);
    console.log(`BACKEND INSTANCE STARTED`);
    console.log(`Process ID: ${processId}`);
    console.log(`Startup Time: ${startupTimestamp}`);
    console.log(`Unique Instance ID: ${uniqueId}`);
    console.log(`Server: http://localhost:${API_PORT}`);
    console.log(`========================================`);
  },
);
// execute: npx tsx --watch index.ts
// http://localhost:8089
