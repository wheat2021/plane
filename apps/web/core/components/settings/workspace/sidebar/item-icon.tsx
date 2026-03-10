import type { LucideIcon } from "lucide-react";
import { ArrowUpToLine, Building, CreditCard, Layers, ListPlus, Users, Webhook } from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import type { TWorkspaceSettingsTabs } from "@plane/types";

export const WORKSPACE_SETTINGS_ICONS: Record<TWorkspaceSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: Building,
  members: Users,
  export: ArrowUpToLine,
  "billing-and-plans": CreditCard,
  webhooks: Webhook,
  "extra-properties": ListPlus,
  "work-item-types": Layers,
};
