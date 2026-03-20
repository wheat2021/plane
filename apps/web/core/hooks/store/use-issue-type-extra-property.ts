import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IIssueTypeExtraPropertyStore } from "@/store/issue-type-extra-property.store";

export const useIssueTypeExtraProperty = (): IIssueTypeExtraPropertyStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssueTypeExtraProperty must be used within StoreProvider");
  return context.issueTypeExtraProperty;
};
