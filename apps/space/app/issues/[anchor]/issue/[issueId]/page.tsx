import { observer } from "mobx-react";
import { Link2, ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useHref } from "react-router";
import useSWR from "swr";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
import { FullScreenPeekView } from "@/components/issues/peek-overview/full-screen-peek-view";
import { PageNotFound } from "@/components/ui/not-found";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { usePublish, usePublishList } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useMember } from "@/hooks/store/use-member";
import useClipboardWritePermission from "@/hooks/use-clipboard-write-permission";
// types
import type { Route } from "./+types/page";

const DEFAULT_TITLE = "Plane";
const DEFAULT_DESCRIPTION = "Made with Plane, an AI-powered work management platform with publishing capabilities.";

interface IssueMeta {
  name?: string;
  description?: string;
  identifier?: string;
}

// SSR loader: fetch issue meta for OG tags
export async function loader({ params }: Route.LoaderArgs) {
  const anchor = params.anchor;
  const issueId = params.issueId;

  const ANCHOR_REGEX = /^[a-zA-Z0-9_-]+$/;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!ANCHOR_REGEX.test(anchor) || !UUID_REGEX.test(issueId)) {
    return { metadata: null };
  }

  const apiBase = process.env.VITE_API_BASE_URL;
  if (!apiBase) return { metadata: null };

  try {
    const response = await fetch(`${apiBase}/api/public/anchor/${anchor}/issues/${issueId}/meta/`);
    if (!response.ok) return { metadata: null };
    const metadata = (await response.json()) as IssueMeta;
    return { metadata };
  } catch {
    return { metadata: null };
  }
}

// meta function generates page title and OG tags
export function meta({ loaderData }: Route.MetaArgs) {
  const metadata = (loaderData as { metadata: IssueMeta | null } | undefined)?.metadata;
  const identifier = metadata?.identifier || "";
  const name = metadata?.name || "";
  const title = identifier && name ? `${identifier} · ${name}` : name || DEFAULT_TITLE;
  const description = metadata?.description || DEFAULT_DESCRIPTION;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

const IssueDetailPage = observer(function IssueDetailPage() {
  const params = useParams<{ anchor: string; issueId: string }>();

  const { anchor, issueId } = params;
  const boardHref = useHref(anchor ? `/issues/${anchor}` : "/");
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const publishSettings = usePublish(anchor);
  const { fetchIssueDetails, getIssueById } = useIssueDetails();
  const { fetchMembers } = useMember();
  const isClipboardWriteAllowed = useClipboardWritePermission();

  // Load publish settings (validates anchor)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { error: settingsError } = useSWR(
    anchor ? `PUBLISH_SETTINGS_${anchor}` : null,
    anchor ? () => fetchPublishSettings(anchor) : null
  );

  // Load members
  useSWR(anchor ? `PUBLIC_MEMBERS_${anchor}` : null, anchor ? () => fetchMembers(anchor) : null);

  // Load full issue details
  useSWR(
    anchor && issueId ? `PUBLIC_ISSUE_DETAIL_${anchor}_${issueId}` : null,
    anchor && issueId ? () => fetchIssueDetails(anchor, issueId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueDetails = issueId ? getIssueById(issueId) : undefined;

  const handleCopyLink = () => {
    void copyTextToClipboard(window.location.href).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied!",
        message: "Work item link copied to clipboard.",
      });
      return undefined;
    });
  };

  if (!publishSettings && !settingsError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-1">
        <LogoSpinner />
      </div>
    );
  }

  if ((settingsError as { status?: number } | undefined)?.status === 404) return <PageNotFound />;
  if (settingsError) return <SomethingWentWrongError />;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-1">
      {/* Minimal standalone header */}
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-subtle-1 bg-surface-1 px-4">
        <a href={boardHref} className="flex items-center gap-2 text-sm text-tertiary hover:text-secondary">
          <ArrowLeft className="size-4" />
          <span>返回看板</span>
        </a>
        {isClipboardWriteAllowed && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-tertiary hover:bg-layer-transparent-hover hover:text-secondary"
          >
            <Link2 className="size-3.5 -rotate-45" />
            <span>复制链接</span>
          </button>
        )}
      </div>
      {/* Full-screen issue detail (standalone mode, no overlay header) */}
      <div className="relative flex-1 overflow-hidden">
        <FullScreenPeekView anchor={anchor} issueDetails={issueDetails} standalone />
      </div>
    </div>
  );
});

export default IssueDetailPage;
