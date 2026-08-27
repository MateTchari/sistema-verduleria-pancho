import { promises as fs } from "fs";
import path from "path";
import type { AppStore } from "./types";

const dataFilePath = path.join(process.cwd(), "src", "lib", "data", "app-data.json");

const defaultStore: AppStore = {
  organizations: [],
  branches: [],
  users: [],
  products: [],
  sales: [],
  cashSessions: [],
  tables: [],
  auditLogs: [],
};

export async function readStore(): Promise<AppStore> {
  try {
    const file = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(file) as AppStore;
    return {
      ...defaultStore,
      ...parsed,
      organizations: parsed.organizations ?? [],
      branches: parsed.branches ?? [],
      users: parsed.users ?? [],
      products: parsed.products ?? [],
      sales: parsed.sales ?? [],
      cashSessions: parsed.cashSessions ?? [],
      tables: parsed.tables ?? [],
      auditLogs: parsed.auditLogs ?? [],
    };
  } catch {
    await ensureStoreFile();
    return defaultStore;
  }
}

export async function writeStore(store: AppStore): Promise<void> {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(store, null, 2), "utf8");
}

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(defaultStore, null, 2), "utf8");
}
