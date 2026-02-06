import React, { useCallback, useRef } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
// plane editor
import type { EditorRefApi } from "@plane/editor";
// plane types
import { EFileAssetType } from "@plane/types";
import type { TExtraPropertyConfig, TExtraPropertyValue } from "@plane/types";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";

interface IMarkdownControl {
  config: TExtraPropertyConfig;
  value: TExtraPropertyValue;
  onChange: (value: string) => void;
  disabled?: boolean;
  workspaceSlug?: string;
  projectId?: string;
}

export const MarkdownControl: FC<IMarkdownControl> = observer((props) => {
  const { config, value, onChange, disabled = false, workspaceSlug, projectId } = props;

  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();

  // derived values
  const workspaceId = workspaceSlug ? (getWorkspaceBySlug(workspaceSlug)?.id ?? "") : "";
  const initialValue = (value as string) || "<p></p>";
  const editable = !disabled;

  // refs for tracking content and save state
  const editorRef = useRef<EditorRefApi>(null);
  const latestHtmlRef = useRef<string>(initialValue);
  const savedValueRef = useRef<string>(initialValue);

  // Handle content changes - track latest HTML
  const handleChange = useCallback((_json: object, html: string) => {
    latestHtmlRef.current = html;
  }, []);

  // Save on blur when focus leaves the editor area
  const handleContainerBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        const currentHtml = latestHtmlRef.current;
        if (currentHtml !== savedValueRef.current) {
          savedValueRef.current = currentHtml;
          onChange(currentHtml);
        }
      }
    },
    [onChange]
  );

  if (!workspaceSlug || !workspaceId) return null;

  // Build editable-specific props (discriminated union)
  const editableProps = editable
    ? {
        editable: true as const,
        uploadFile: async (blockId: string, file: File) => {
          const { asset_id } = await uploadEditorAsset({
            blockId,
            data: {
              entity_identifier: config.id,
              entity_type: EFileAssetType.COMMENT_DESCRIPTION,
            },
            file,
            projectId,
            workspaceSlug,
          });
          return asset_id;
        },
        duplicateFile: async (assetId: string) => {
          const { asset_id } = await duplicateEditorAsset({
            assetId,
            entityId: config.id,
            entityType: EFileAssetType.COMMENT_DESCRIPTION,
            projectId,
            workspaceSlug,
          });
          return asset_id;
        },
      }
    : { editable: false as const };

  return (
    <div className="w-full" onBlur={handleContainerBlur}>
      <LiteTextEditor
        ref={editorRef}
        id={`extra-property-${config.id}`}
        initialValue={initialValue}
        onChange={handleChange}
        placeholder={config.description || `Enter ${config.label}...`}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        projectId={projectId}
        variant="none"
        showSubmitButton={false}
        parentClassName="!border-0"
        containerClassName="!p-0"
        editorClassName="!pl-0 !pt-0 !pb-0 text-sm"
        showPlaceholderOnEmpty
        {...editableProps}
      />
    </div>
  );
});
