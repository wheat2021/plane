import { action, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";

const STORAGE_KEY = "plane-default-prop-config";

export const CONFIGURABLE_DEFAULT_PROPERTIES = [
  { key: "created_by", label: "Reporter" },
  { key: "assignee_ids", label: "Assignees" },
  { key: "priority", label: "Priority" },
  { key: "label_ids", label: "Labels" },
  { key: "start_date", label: "Start Date" },
  { key: "target_date", label: "Due Date" },
  { key: "estimate_point", label: "Estimate" },
  { key: "module_ids", label: "Modules" },
  { key: "cycle_id", label: "Cycle" },
  { key: "parent_id", label: "Parent" },
] as const;

export type TDefaultPropertyKey = (typeof CONFIGURABLE_DEFAULT_PROPERTIES)[number]["key"];

type TStorageData = Record<string, Record<string, Record<string, { description: string }>>>;

export interface IDefaultPropertyConfigStore {
  // observables
  data: TStorageData;
  // computed
  getDescription: (workspaceSlug: string, issueTypeId: string, propertyKey: string) => string;
  // actions
  setDescription: (workspaceSlug: string, issueTypeId: string, propertyKey: string, description: string) => void;
}

export class DefaultPropertyConfigStore implements IDefaultPropertyConfigStore {
  data: TStorageData = {};

  constructor() {
    makeObservable(this, {
      data: observable,
      setDescription: action,
    });
    this._loadFromStorage();
  }

  private _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.data = JSON.parse(raw) as TStorageData;
    } catch {
      this.data = {};
    }
  }

  private _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ignore storage errors
    }
  }

  getDescription = computedFn((workspaceSlug: string, issueTypeId: string, propertyKey: string): string => {
    return this.data[workspaceSlug]?.[issueTypeId]?.[propertyKey]?.description ?? "";
  });

  setDescription = (workspaceSlug: string, issueTypeId: string, propertyKey: string, description: string) => {
    if (!this.data[workspaceSlug]) this.data[workspaceSlug] = {};
    if (!this.data[workspaceSlug][issueTypeId]) this.data[workspaceSlug][issueTypeId] = {};
    this.data[workspaceSlug][issueTypeId][propertyKey] = { description };
    this._saveToStorage();
  };
}
