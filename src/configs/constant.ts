import dotenv from "dotenv";
dotenv.config(); // implement .env file

// Add fallback value from env for stability
export const PORT: number = Number(process.env.PORT) || 8089; // default port is 8089
export const DUMMY: string = process.env.DUMMY || "Dummy Export";
export const MONGODB_URL: string =
  process.env.MONGODB_URL || "mongodb://localhost:27017/sajilo-stay-web"; // default MongoDB URL
export const SECRET_KEY: string = process.env.SECRET_KEY || "merosecretkey";
// same as
// export {
//     PORT,
//     DUMMY,
//     MONGODB_URL
// }
