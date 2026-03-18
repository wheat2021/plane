"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// hooks
import { useDefaultPropertyConfig } from "@/hooks/store/use-default-property-config";
import { CONFIGURABLE_DEFAULT_PROPERTIES } from "@/store/default-property-config.store";

type Props = {
  issueTypeId: string;
};

export const DefaultPropertyConfigList = observer(function DefaultPropertyConfigList({ issueTypeId }: Props) {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { getDescription, setDescription } = useDefaultPropertyConfig();
  // local draft state: propertyKey -> current textarea value
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!workspaceSlug) return null;

  const handleChange = (key: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
    setDescription(workspaceSlug, issueTypeId, key, value);
  };

  return (
    <div className="border-b border-custom-border-200 px-4 py-3">
      <h6 className="mb-2 text-xs font-medium text-custom-text-300">Default Properties</h6>
      <div className="space-y-1.5">
        {CONFIGURABLE_DEFAULT_PROPERTIES.map(({ key, label }) => {
          const saved = getDescription(workspaceSlug, issueTypeId, key);
          const value = key in drafts ? drafts[key] : saved;
          return (
            <div key={key} className="flex items-start gap-3">
              <span className="w-28 flex-shrink-0 text-xs text-custom-text-200 leading-7">{label}</span>
              <textarea
                rows={1}
                className="flex-1 resize-none rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:outline-none"
                placeholder="Add description (supports Markdown)…"
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
