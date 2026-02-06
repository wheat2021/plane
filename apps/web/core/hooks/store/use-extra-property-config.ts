import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IExtraPropertyConfigStore } from "@/store/extra-property-config.store";

export const useExtraPropertyConfig = (): IExtraPropertyConfigStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useExtraPropertyConfig must be used within StoreProvider");
  return context.extraPropertyConfig;
};
