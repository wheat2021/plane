import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IDefaultPropertyConfigStore } from "@/store/default-property-config.store";

export const useDefaultPropertyConfig = (): IDefaultPropertyConfigStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useDefaultPropertyConfig must be used within StoreProvider");
  return context.defaultPropertyConfig;
};
