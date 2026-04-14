import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
// components
import { IssuesLayoutsRoot } from "@/components/issues/issue-layouts";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useStates } from "@/hooks/store/use-state";

const IssuesPage = observer(function IssuesPage() {
  // params
  const params = useParams<{ anchor: string }>();
  const { anchor } = params;
  const searchParams = useSearchParams();
  const peekId = searchParams.get("peekId") || undefined;
  // store
  const { fetchStates } = useStates();
  const { fetchLabels } = useLabel();
  const { fetchMembers } = useMember();

  useSWR(anchor ? `PUBLIC_STATES_${anchor}` : null, anchor ? () => fetchStates(anchor) : null);
  useSWR(anchor ? `PUBLIC_LABELS_${anchor}` : null, anchor ? () => fetchLabels(anchor) : null);
  useSWR(anchor ? `PUBLIC_MEMBERS_${anchor}` : null, anchor ? () => fetchMembers(anchor) : null);

  const publishSettings = usePublish(anchor);

  if (!publishSettings) return null;

  return <IssuesLayoutsRoot peekId={peekId} publishSettings={publishSettings} />;
});

export default IssuesPage;
