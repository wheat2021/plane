import { forwardRef, useMemo } from "react";
// plane imports
import { DocumentEditorWithRef, AnalyticsChartProvider } from "@plane/editor";
import type { IEditorPropsExtended, EditorRefApi, IDocumentEditorProps, TFileHandler } from "@plane/editor";
import type { MakeOptional, TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
import { cn } from "@plane/utils";
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
// local imports
import { EditorMentionsRoot } from "../embeds/mentions";

type DocumentEditorWrapperProps = MakeOptional<
  Omit<IDocumentEditorProps, "fileHandler" | "mentionHandler" | "user" | "extendedEditorProps">,
  "disabledExtensions" | "editable" | "flaggedExtensions" | "getEditorMetaData"
> & {
  extendedEditorProps?: Partial<IEditorPropsExtended>;
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
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

export const DocumentEditor = forwardRef(function DocumentEditor(
  props: DocumentEditorWrapperProps,
  ref: React.ForwardedRef<EditorRefApi>
) {
  const {
    containerClassName,
    editable,
    extendedEditorProps,
    workspaceSlug,
    workspaceId,
    projectId,
    disabledExtensions: additionalDisabledExtensions = [],
    ...rest
  } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { workspaceProjectIds, getProjectById } = useProject();
  // parse content
  const { getEditorMetaData } = useParseEditorContent({
    projectId,
    workspaceSlug,
  });
  // editor flaggings
  const { document: documentEditorExtensions } = useEditorFlagging({
    workspaceSlug,
    projectId,
  });
  // use editor mention
  const { fetchMentions } = useEditorMention({
    enableAdvancedMentions: true,
    searchEntity: editable ? async (payload) => props.searchMentionCallback(payload) : () => ({}),
  });
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();
  // analytics chart options (static + extra properties)
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

  return (
    <AnalyticsChartProvider value={analyticsChartCtx}>
      <DocumentEditorWithRef
        ref={ref}
        disabledExtensions={[...documentEditorExtensions.disabled, ...(additionalDisabledExtensions ?? [])]}
        editable={editable}
        flaggedExtensions={documentEditorExtensions.flagged}
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
          getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
        }}
        extendedEditorProps={extendedEditorProps}
        {...rest}
        containerClassName={cn("relative pl-3 pb-3", containerClassName)}
      />
    </AnalyticsChartProvider>
  );
});

DocumentEditor.displayName = "DocumentEditor";
