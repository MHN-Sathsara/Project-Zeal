import Dexie, { type Table } from "dexie";

export interface Task {
  id: string;
  title: string;
  emoji?: string;
  archived: boolean;
  createdAt: string;
}
export interface XpLog {
  id: string; // taskId + date e.g. "abc123_2026-06-30"
  taskId: string;
  date: string;
}

export interface Completion {
  id: string;
  taskId: string;
  date: string; // "YYYY-MM-DD"
}
export interface Meta {
  key: string;
  value: any;
}

class ZealDB extends Dexie {
  tasks!: Table<Task, string>;
  completions!: Table<Completion, string>;
  meta!: Table<Meta, string>;
  xpLog!: Table<XpLog, string>;

  constructor() {
    super("zeal_db");
    this.version(3).stores({
      tasks: "id, archived",
      completions: "id, taskId, date",
      meta: "key",
      xpLog: "id, taskId, date"
    });
  }
}

export const db = new ZealDB();