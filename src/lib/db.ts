import Dexie, { type Table } from "dexie";

export interface Task {
  id: string;
  title: string;
  emoji?: string;
  archived: boolean;
  createdAt: string;
}

export interface Completion {
  id: string;
  taskId: string;
  date: string; // "YYYY-MM-DD"
}

class ZealDB extends Dexie {
  tasks!: Table<Task, string>;
  completions!: Table<Completion, string>;

  constructor() {
    super("zeal_db");
    this.version(1).stores({
      tasks: "id, archived",
      completions: "id, taskId, date"
    });
  }
}

export const db = new ZealDB();