import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "stocks-manager";

// In development, Next.js clears the module cache on every hot reload. Without
// caching the client on the global object we would open a brand new connection
// pool on each reload and eventually exhaust the database's connections. We
// store a single shared connection promise on `globalThis` so it survives
// reloads and is reused across the whole app.
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise: Promise<MongoClient> =
  globalForMongo._mongoClientPromise ?? new MongoClient(uri).connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClientPromise = clientPromise;
}

/** Returns the shared, connected database handle. */
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
