"use client";

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import type { TIssueType } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { WorkItemTypeItem } from "./type-item";
// hooks
import { useIssueType } from "@/hooks/store/use-issue-type";

type TTypeListProps = {
  issueTypes: TIssueType[];
  isFormOpen: boolean;
};

export const WorkItemTypeList = observer(function WorkItemTypeList({ issueTypes, isFormOpen }: TTypeListProps) {
  const { workspaceSlug } = useParams();
  const { updateWorkspaceIssueType } = useIssueType();
  const [orderedIds, setOrderedIds] = useState<string[]>(issueTypes.map((t) => t.id));

  // Sync ordered ids when the source list changes (new items added/removed)
  const currentIds = issueTypes.map((t) => t.id);
  if (JSON.stringify(currentIds) !== JSON.stringify(orderedIds)) {
    setOrderedIds(currentIds);
  }

  const handleDragEnd = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || !workspaceSlug) return;

      const newOrder = [...orderedIds];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      setOrderedIds(newOrder);

      try {
        await Promise.all(newOrder.map((id, idx) => updateWorkspaceIssueType(workspaceSlug, id, { level: idx })));
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to save order",
        });
        setOrderedIds(currentIds);
      }
    },
    [orderedIds, currentIds, workspaceSlug, updateWorkspaceIssueType]
  );

  // Simple drag-and-drop using HTML5 drag API
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {orderedIds.map((id, index) => (
        <div
          key={id}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverIndex(index);
          }}
          onDragEnd={() => {
            if (dragIndex !== null && dragOverIndex !== null) {
              void handleDragEnd(dragIndex, dragOverIndex);
            }
            setDragIndex(null);
            setDragOverIndex(null);
          }}
          className={`transition-opacity ${dragIndex === index ? "opacity-50" : "opacity-100"} ${
            dragOverIndex === index && dragIndex !== index ? "ring-1 ring-custom-primary-100 rounded-md" : ""
          }`}
        >
          <WorkItemTypeItem issueTypeId={id} />
        </div>
      ))}
      {isFormOpen && orderedIds.length === 0 && (
        <div className="flex items-center justify-center py-8 text-custom-text-400 text-sm">No types yet</div>
      )}
    </div>
  );
});
