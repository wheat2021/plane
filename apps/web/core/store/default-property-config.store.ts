import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";

const STORAGE_KEY = "plane-default-prop-config";

export const CONFIGURABLE_DEFAULT_PROPERTIES = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
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

type TPropertyConfig = { alias?: string; description?: string };
type TStorageData = Record<string, Record<string, Record<string, TPropertyConfig>>>;

export interface IDefaultPropertyConfigStore {
  // observables
  data: TStorageData;
  // computed
  getAlias: (workspaceSlug: string, issueTypeId: string, propertyKey: string) => string;
  getDescription: (workspaceSlug: string, issueTypeId: string, propertyKey: string) => string;
  // actions
  setAlias: (workspaceSlug: string, issueTypeId: string, propertyKey: string, alias: string) => void;
  setDescription: (workspaceSlug: string, issueTypeId: string, propertyKey: string, description: string) => void;
}

export class DefaultPropertyConfigStore implements IDefaultPropertyConfigStore {
  data: TStorageData = {};

  constructor() {
    makeObservable(this, {
      data: observable,
      setAlias: action,
      setDescription: action,
    });
    this._loadFromStorage();
  }

  private _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as TStorageData) : {};
      runInAction(() => {
        this.data = parsed;
      });
    } catch {
      runInAction(() => {
        this.data = {};
      });
    }
  }

  private _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ignore storage errors
    }
  }

  getAlias = computedFn((workspaceSlug: string, issueTypeId: string, propertyKey: string): string => {
    return this.data[workspaceSlug]?.[issueTypeId]?.[propertyKey]?.alias ?? "";
  });

  getDescription = computedFn((workspaceSlug: string, issueTypeId: string, propertyKey: string): string => {
    return this.data[workspaceSlug]?.[issueTypeId]?.[propertyKey]?.description ?? "";
  });

  setAlias = (workspaceSlug: string, issueTypeId: string, propertyKey: string, alias: string) => {
    const existing = this.data[workspaceSlug]?.[issueTypeId]?.[propertyKey] ?? {};
    set(this.data, [workspaceSlug, issueTypeId, propertyKey], { ...existing, alias });
    this._saveToStorage();
  };

  setDescription = (workspaceSlug: string, issueTypeId: string, propertyKey: string, description: string) => {
    const existing = this.data[workspaceSlug]?.[issueTypeId]?.[propertyKey] ?? {};
    set(this.data, [workspaceSlug, issueTypeId, propertyKey], { ...existing, description });
    this._saveToStorage();
  };
}
