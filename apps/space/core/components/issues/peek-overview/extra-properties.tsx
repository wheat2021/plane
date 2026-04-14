import { observer } from "mobx-react";
import useSWR from "swr";
// hooks
import { useMember } from "@/hooks/store/use-member";
// types
import type { TExtraPropertyConfig, TExtraPropertyValue, TIssueExtraProperties, TReferenceItem } from "@plane/types";

// Extends TExtraPropertyConfig with binding-level fields returned by our public endpoint
interface IPublicExtraPropertyConfig extends TExtraPropertyConfig {
  is_required?: boolean;
}

type Props = {
  anchor: string;
  typeId: string;
  values: TIssueExtraProperties | undefined;
};

async function fetchExtraPropertyConfigs(anchor: string, typeId: string): Promise<IPublicExtraPropertyConfig[]> {
  const res = await fetch(`/api/public/anchor/${anchor}/issue-types/${typeId}/extra-property-configs/`);
  if (!res.ok) return [];
  return (await res.json()) as IPublicExtraPropertyConfig[];
}

// -- value renderers --

function TextValue({ value }: { value: TExtraPropertyValue }) {
  if (value == null || value === "") return <span className="text-tertiary">Empty</span>;
  return <span className="truncate">{typeof value === "string" ? value : JSON.stringify(value)}</span>;
}

function SelectValue({ config, value }: { config: IPublicExtraPropertyConfig; value: TExtraPropertyValue }) {
  const options = config.options ?? [];
  const selectedKey = value as string | null;
  if (!selectedKey) return <span className="text-tertiary">Empty</span>;
  const option = options.find((o) => o.value === selectedKey);
  return <span>{option?.label ?? selectedKey}</span>;
}

function MultiSelectValue({ config, value }: { config: IPublicExtraPropertyConfig; value: TExtraPropertyValue }) {
  const options = config.options ?? [];
  const selected = (value as string[] | null) ?? [];
  if (!selected.length) return <span className="text-tertiary">Empty</span>;
  const labels = selected.map((key) => options.find((o) => o.value === key)?.label ?? key);
  return <span className="truncate">{labels.join(", ")}</span>;
}

function CheckboxValue({ config, value }: { config: IPublicExtraPropertyConfig; value: TExtraPropertyValue }) {
  const trueLabel = config.true_value ?? "Yes";
  const falseLabel = config.false_value ?? "No";
  if (value == null) return <span className="text-tertiary">Empty</span>;
  return <span>{value ? trueLabel : falseLabel}</span>;
}

function MemberValue({ value }: { value: TExtraPropertyValue }) {
  const { getMemberById } = useMember();
  const id = typeof value === "string" ? value : null;
  if (!id) return <span className="text-tertiary">Empty</span>;
  const m = getMemberById(id);
  if (!m) return <span className="text-tertiary">未知成员</span>;
  const name = m.member__display_name || `${m.member__first_name} ${m.member__last_name}`.trim();
  return (
    <span className="flex items-center gap-1.5 truncate">
      {m.member__avatar ? (
        <img src={m.member__avatar} alt={name} className="h-4 w-4 rounded-full shrink-0" />
      ) : (
        <span className="h-4 w-4 rounded-full bg-primary/10 text-[10px] flex items-center justify-center shrink-0">
          {name.charAt(0)}
        </span>
      )}
      {name}
    </span>
  );
}

function ReferenceValue({ value }: { value: TExtraPropertyValue }) {
  const refs = (value as TReferenceItem[] | null) ?? [];
  if (!refs.length) return <span className="text-tertiary">Empty</span>;
  return (
    <span className="truncate">
      {refs.map((r, i) => (
        <span key={i}>
          {i > 0 && ", "}
          {r.url ? (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
              {r.display || r.url}
            </a>
          ) : (
            r.display
          )}
        </span>
      ))}
    </span>
  );
}

function ExtraPropertyValue({ config, value }: { config: IPublicExtraPropertyConfig; value: TExtraPropertyValue }) {
  switch (config.type) {
    case "text":
    case "textarea":
      return <TextValue value={value} />;
    case "select":
      return <SelectValue config={config} value={value} />;
    case "multiselect":
      return <MultiSelectValue config={config} value={value} />;
    case "checkbox":
      return <CheckboxValue config={config} value={value} />;
    case "member":
      return <MemberValue value={value} />;
    case "reference":
      return <ReferenceValue value={value} />;
    default:
      return <TextValue value={value} />;
  }
}

export const ExtraPropertiesReadOnly = observer(function ExtraPropertiesReadOnly({ anchor, typeId, values }: Props) {
  const { data: configs } = useSWR(
    anchor && typeId ? `EXTRA_PROP_CONFIGS_${anchor}_${typeId}` : null,
    anchor && typeId ? () => fetchExtraPropertyConfigs(anchor, typeId) : null,
    { revalidateOnFocus: false, revalidateIfStale: false }
  );

  if (!configs || configs.length === 0) return null;

  return (
    <>
      {configs.map((config) => (
        <div key={config.id} className="flex items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-13 text-tertiary">
            <span className="truncate">
              {config.label}
              {config.is_required ? " *" : ""}
            </span>
          </div>
          <div className="w-3/4 text-13 text-secondary">
            <ExtraPropertyValue config={config} value={values?.[config.key] ?? null} />
          </div>
        </div>
      ))}
    </>
  );
});
