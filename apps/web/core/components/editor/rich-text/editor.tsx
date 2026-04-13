import { forwardRef, useMemo } from "react";
// plane imports
import { RichTextEditorWithRef, AnalyticsChartProvider } from "@plane/editor";
import type { EditorRefApi, IRichTextEditorProps, TFileHandler } from "@plane/editor";
import type { MakeOptional, TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor/embeds/mentions";
// hooks
import { useEditorConfig, useEditorMention } from "@/hooks/editor";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useParseEditorContent } from "@/hooks/use-parse-editor-content";
// analytics hooks
import {
  useAnalyticsXAxisOptions,
  useAnalyticsIssueTypeOptions,
} from "@/components/analytics/hooks/use-analytics-options";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

type RichTextEditorWrapperProps = MakeOptional<
  Omit<IRichTextEditorProps, "fileHandler" | "mentionHandler" | "extendedEditorProps">,
  "disabledExtensions" | "editable" | "flaggedExtensions" | "getEditorMetaData"
> & {
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
  issueSequenceId?: number;
} & (
    | {
        editable: false;
      }
    | {
        editable: true;
        searchMentionCallback: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
        uploadFile: TFileHandler["upload"];
        duplicateFile: TFileHandler["duplicate"];
      }
  );

export const RichTextEditor = forwardRef(function RichTextEditor(
  props: RichTextEditorWrapperProps,
  ref: React.ForwardedRef<EditorRefApi>
) {
  const {
    containerClassName,
    editable,
    workspaceSlug,
    workspaceId,
    projectId,
    disabledExtensions: additionalDisabledExtensions = [],
    ...rest
  } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { workspaceProjectIds, getProjectById } = useProject();
  // analytics chart context
  const xAxisOptions = useAnalyticsXAxisOptions(workspaceSlug);
  const rawIssueTypeOptions = useAnalyticsIssueTypeOptions(workspaceSlug);
  const projectOptions = useMemo(
    () =>
      (workspaceProjectIds ?? []).map((id) => {
        const project = getProjectById(id);
        return { value: id, label: project?.name ?? id };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceProjectIds]
  );
  const issueTypeOptions = useMemo(
    () => rawIssueTypeOptions.map((o) => ({ value: o.issueTypeName ?? "", label: o.label })),
    [rawIssueTypeOptions]
  );
  const analyticsChartCtx = useMemo(
    () => ({ xAxisOptions, projectOptions, issueTypeOptions }),
    [xAxisOptions, projectOptions, issueTypeOptions]
  );
  // editor flaggings
  const { richText: richTextEditorExtensions } = useEditorFlagging({
    workspaceSlug,
    projectId,
  });
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: editable ? async (payload) => props.searchMentionCallback(payload) : () => ({}),
  });
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();
  // parse content
  const { getEditorMetaData } = useParseEditorContent({
    projectId,
    workspaceSlug,
  });

  return (
    <AnalyticsChartProvider value={analyticsChartCtx}>
      <RichTextEditorWithRef
        ref={ref}
        disabledExtensions={[...richTextEditorExtensions.disabled, ...(additionalDisabledExtensions ?? [])]}
        editable={editable}
        flaggedExtensions={richTextEditorExtensions.flagged}
        fileHandler={getEditorFileHandlers({
          projectId,
          uploadFile: editable ? props.uploadFile : () => Promise.resolve(""),
          duplicateFile: editable ? props.duplicateFile : () => Promise.resolve(""),
          workspaceId,
          workspaceSlug,
        })}
        getEditorMetaData={getEditorMetaData}
        mentionHandler={{
          searchCallback: async (query) => {
            const res = await fetchMentions(query);
            if (!res) throw new Error("Failed in fetching mentions");
            return res;
          },
          renderComponent: EditorMentionsRoot,
          getMentionedEntityDetails: (id) => ({
            display_name: getUserDetails(id)?.display_name ?? "",
          }),
        }}
        extendedEditorProps={{}}
        {...rest}
        containerClassName={cn("relative pl-3 pb-3", containerClassName)}
      />
    </AnalyticsChartProvider>
  );
});

RichTextEditor.displayName = "RichTextEditor";
