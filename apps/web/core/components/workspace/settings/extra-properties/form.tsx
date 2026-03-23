"use client";

import { useEffect, useState, useCallback } from "react";
import { icons, Plus, Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { observer } from "mobx-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TExtraPropertyConfigPayload, TExtraPropertyType } from "@plane/types";
import { Button, CustomSelect, Input, TextArea, ToggleSwitch } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Popover } from "@headlessui/react";
import { IconColorPicker } from "@/components/workspace/settings/work-item-types";
// hooks
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";

function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function getLucideIcon(name: string): LucideIcon | null {
  if (!name) return null;
  const key = toPascalCase(name);
  return (icons as Record<string, LucideIcon>)[key] ?? null;
}

type Props = {
  configId: string | null;
  onClose: () => void;
};

type FormValues = {
  key: string;
  label: string;
  type: TExtraPropertyType;
  description: string;
  options: { value: string; label: string; extra_input_config?: string; extra_input_required?: boolean }[];
  true_value: string;
  false_value: string;
  true_extra_input_config: string;
  true_extra_input_required: boolean;
  false_extra_input_config: string;
  false_extra_input_required: boolean;
  true_icon?: string;
  true_icon_color?: string;
  false_icon?: string;
  false_icon_color?: string;
  member_color?: string;
};

const PROPERTY_TYPES: { value: TExtraPropertyType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "member", label: "Member" },
  { value: "reference", label: "Reference" },
];

/**
 * Static compatibility matrix for type changes.
 * Returns true if values are format-compatible (no data loss risk).
 */
const isTypeCompatible = (from: TExtraPropertyType, to: TExtraPropertyType): boolean => {
  if (from === to) return true;
  const compatible: Record<string, Set<string>> = {
    text: new Set(["textarea"]),
    textarea: new Set(["text"]),
    select: new Set(["text", "textarea", "multiselect"]),
    multiselect: new Set(["multiselect"]),
    checkbox: new Set(["text", "textarea", "checkbox"]),
    member: new Set(["text", "textarea"]),
    reference: new Set([]),
  };
  return compatible[from]?.has(to) ?? false;
};

export const ExtraPropertyForm = observer(function ExtraPropertyForm({ configId, onClose }: Props) {
  // params
  const { workspaceSlug } = useParams();
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactData, setImpactData] = useState<{ count: number; distinct_values: string[] } | null>(null);
  // store hooks
  const { getConfigById, getConfigsByWorkspace, createConfig, updateConfig, fetchConfigValues } =
    useExtraPropertyConfig();
  // i18n
  const { t } = useTranslation();
  // derived values
  const existingConfig = configId ? getConfigById(configId) : null;
  const isEditMode = !!existingConfig;

  // form
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      key: "",
      label: "",
      type: "text",
      description: "",
      options: [{ value: "", label: "", extra_input_config: "", extra_input_required: false }],
      true_value: "Yes",
      false_value: "No",
      true_extra_input_config: "",
      true_extra_input_required: false,
      false_extra_input_config: "",
      false_extra_input_required: false,
      true_icon: undefined,
      true_icon_color: undefined,
      false_icon: undefined,
      false_icon_color: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const selectedType = watch("type");
  const showOptions = selectedType === "select" || selectedType === "multiselect";
  const showCheckboxValues = selectedType === "checkbox";
  const showMemberColor = selectedType === "member";
  const memberColorValue = watch("member_color");
  const trueIconValue = watch("true_icon");
  const trueIconColorValue = watch("true_icon_color");
  const falseIconValue = watch("false_icon");
  const falseIconColorValue = watch("false_icon_color");

  // Available configs for extra input dropdown (exclude self and cycle-forming)
  const availableExtraInputConfigs = (() => {
    const allConfigs = getConfigsByWorkspace(workspaceSlug as string) || [];
    const filtered = allConfigs.filter((c) => c.id !== configId);
    if (!configId) return filtered;
    // Build dependency graph to detect cycles
    const graph = new Map<string, Set<string>>();
    for (const c of allConfigs) {
      const targets = new Set<string>();
      for (const opt of c.options ?? []) {
        if (opt.extra_input?.config) targets.add(opt.extra_input.config);
      }
      if (c.true_extra_input?.config) targets.add(c.true_extra_input.config);
      if (c.false_extra_input?.config) targets.add(c.false_extra_input.config);
      graph.set(c.id, targets);
    }
    // Check if adding configId -> candidateId would create a cycle
    const wouldCycle = (candidateId: string): boolean => {
      const visited = new Set<string>();
      const stack = [candidateId];
      while (stack.length > 0) {
        const node = stack.pop()!;
        if (node === configId) return true;
        if (visited.has(node)) continue;
        visited.add(node);
        for (const nb of graph.get(node) ?? []) stack.push(nb);
      }
      return false;
    };
    return filtered.filter((c) => !wouldCycle(c.id));
  })();

  useEffect(() => {
    if (existingConfig) {
      reset({
        key: existingConfig.key,
        label: existingConfig.label,
        type: existingConfig.type,
        description: existingConfig.description || "",
        options: existingConfig.options?.length
          ? existingConfig.options.map((o) => ({
              value: o.value,
              label: o.label || "",
              extra_input_config: o.extra_input?.config || "",
              extra_input_required: o.extra_input?.required || false,
            }))
          : [{ value: "", label: "", extra_input_config: "", extra_input_required: false }],
        true_value: existingConfig.true_value || "Yes",
        false_value: existingConfig.false_value || "No",
        true_extra_input_config: existingConfig.true_extra_input?.config || "",
        true_extra_input_required: existingConfig.true_extra_input?.required || false,
        false_extra_input_config: existingConfig.false_extra_input?.config || "",
        false_extra_input_required: existingConfig.false_extra_input?.required || false,
        true_icon: existingConfig.true_icon || undefined,
        true_icon_color: existingConfig.true_icon_color || undefined,
        false_icon: existingConfig.false_icon || undefined,
        false_icon_color: existingConfig.false_icon_color || undefined,
        member_color: existingConfig.member_color || undefined,
      });
    }
  }, [existingConfig, reset]);

  // Check impact when type changes in edit mode
  const checkTypeChangeImpact = useCallback(
    async (newType: TExtraPropertyType) => {
      if (!isEditMode || !existingConfig || !workspaceSlug || !configId) return;
      if (newType === existingConfig.type) {
        setImpactData(null);
        return;
      }
      if (isTypeCompatible(existingConfig.type, newType)) {
        setImpactData(null);
        return;
      }
      // Incompatible change — query impact
      setImpactLoading(true);
      try {
        const data = await fetchConfigValues(workspaceSlug, configId);
        setImpactData(data.count > 0 ? data : null);
      } catch {
        setImpactData(null);
      } finally {
        setImpactLoading(false);
      }
    },
    [isEditMode, existingConfig, workspaceSlug, configId, fetchConfigValues]
  );

  // Watch type changes for impact check
  useEffect(() => {
    if (isEditMode && existingConfig) {
      void checkTypeChangeImpact(selectedType);
    }
  }, [selectedType, isEditMode, existingConfig, checkTypeChangeImpact]);

  const onSubmit = async (data: FormValues) => {
    if (!workspaceSlug) return;

    setIsSubmitting(true);
    try {
      const payload: TExtraPropertyConfigPayload = {
        key: data.key,
        label: data.label,
        type: data.type,
        description: data.description || undefined,
      };

      if (showOptions) {
        payload.options = data.options
          .filter((o) => o.value.trim())
          .map((o) => ({
            value: o.value,
            label: o.label || undefined,
            extra_input: o.extra_input_config
              ? { config: o.extra_input_config, required: o.extra_input_required || false }
              : undefined,
          }));
      }

      if (showCheckboxValues) {
        payload.true_value = data.true_value;
        payload.false_value = data.false_value;
        if (data.true_extra_input_config) {
          payload.true_extra_input = {
            config: data.true_extra_input_config,
            required: data.true_extra_input_required || false,
          };
        } else {
          payload.true_extra_input = null;
        }
        if (data.false_extra_input_config) {
          payload.false_extra_input = {
            config: data.false_extra_input_config,
            required: data.false_extra_input_required || false,
          };
        } else {
          payload.false_extra_input = null;
        }
        if (data.true_icon) {
          payload.true_icon = data.true_icon;
          payload.true_icon_color = data.true_icon_color || undefined;
        } else {
          payload.true_icon = null as unknown as undefined;
          payload.true_icon_color = null as unknown as undefined;
        }
        if (data.false_icon) {
          payload.false_icon = data.false_icon;
          payload.false_icon_color = data.false_icon_color || undefined;
        } else {
          payload.false_icon = null as unknown as undefined;
          payload.false_icon_color = null as unknown as undefined;
        }
      }

      if (data.type === "member") {
        payload.member_color = data.member_color || null;
      }

      if (isEditMode && configId) {
        await updateConfig(workspaceSlug, configId, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.extra_properties.update_success"),
        });
      } else {
        await createConfig(workspaceSlug, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.extra_properties.create_success"),
        });
      }
      onClose();
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: isEditMode
          ? t("workspace_settings.settings.extra_properties.update_error")
          : t("workspace_settings.settings.extra_properties.create_error"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="rounded-lg border border-custom-border-200 p-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("workspace_settings.settings.extra_properties.form.label")} *
            </label>
            <Input
              {...register("label", { required: true })}
              placeholder={t("workspace_settings.settings.extra_properties.form.label_placeholder")}
              className="w-full"
              hasError={!!errors.label}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("workspace_settings.settings.extra_properties.form.key")} *
            </label>
            <Input
              {...register("key", {
                required: true,
                pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
              })}
              placeholder={t("workspace_settings.settings.extra_properties.form.key_placeholder")}
              className="w-full"
              hasError={!!errors.key}
              disabled={isEditMode}
            />
            {errors.key && (
              <p className="mt-1 text-xs text-red-500">
                {t("workspace_settings.settings.extra_properties.form.key_error")}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("workspace_settings.settings.extra_properties.form.type")} *
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <CustomSelect
                value={field.value}
                onChange={field.onChange}
                label={PROPERTY_TYPES.find((t) => t.value === field.value)?.label ?? "Select type"}
                input
                buttonClassName="w-full"
              >
                {PROPERTY_TYPES.map((type) => (
                  <CustomSelect.Option key={type.value} value={type.value}>
                    {type.label}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            )}
          />
          {/* Type change impact warning banner */}
          {isEditMode && impactLoading && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <Loader2 className="size-4 animate-spin" />
              <span>正在检查类型变更的影响范围…</span>
            </div>
          )}
          {isEditMode && !impactLoading && impactData && (
            <div className="mt-2 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p>
                  类型变更将影响 <strong>{impactData.count}</strong> 个工作项的已有值。
                </p>
                {impactData.distinct_values.length > 0 && (
                  <p className="mt-1 text-xs text-yellow-700">
                    现有值：{impactData.distinct_values.slice(0, 10).join("、")}
                    {impactData.distinct_values.length > 10 && " …"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("workspace_settings.settings.extra_properties.form.description")}
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                placeholder={t("workspace_settings.settings.extra_properties.form.description_placeholder")}
                className="w-full"
                rows={2}
              />
            )}
          />
        </div>

        {showOptions && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("workspace_settings.settings.extra_properties.form.options")}
            </label>
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Input
                      {...register(`options.${index}.value` as const)}
                      placeholder={t("workspace_settings.settings.extra_properties.form.option_value")}
                      className="flex-1"
                    />
                    <Input
                      {...register(`options.${index}.label` as const)}
                      placeholder={t("workspace_settings.settings.extra_properties.form.option_label")}
                      className="flex-1"
                    />
                    {fields.length > 1 && (
                      <Button variant="link-neutral" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-xs text-custom-text-300">
                      {t("workspace_settings.settings.extra_properties.form.extra_input")}
                    </span>
                    <Controller
                      name={`options.${index}.extra_input_config` as const}
                      control={control}
                      render={({ field: f }) => (
                        <CustomSelect
                          value={f.value || ""}
                          onChange={f.onChange}
                          label={
                            availableExtraInputConfigs.find((c) => c.id === f.value)?.label ||
                            t("workspace_settings.settings.extra_properties.form.extra_input_none")
                          }
                          input
                          buttonClassName="min-w-[140px] text-xs"
                        >
                          <CustomSelect.Option value="">
                            {t("workspace_settings.settings.extra_properties.form.extra_input_none")}
                          </CustomSelect.Option>
                          {availableExtraInputConfigs.map((c) => (
                            <CustomSelect.Option key={c.id} value={c.id}>
                              {c.label}
                            </CustomSelect.Option>
                          ))}
                        </CustomSelect>
                      )}
                    />
                    {watch(`options.${index}.extra_input_config`) && (
                      <>
                        <span className="text-xs text-custom-text-300">
                          {t("workspace_settings.settings.extra_properties.form.extra_input_required")}
                        </span>
                        <Controller
                          name={`options.${index}.extra_input_required` as const}
                          control={control}
                          render={({ field: f }) => <ToggleSwitch value={!!f.value} onChange={f.onChange} size="sm" />}
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="link-neutral"
                size="sm"
                onClick={() => append({ value: "", label: "", extra_input_config: "", extra_input_required: false })}
                className="self-start"
              >
                <Plus className="size-4 mr-1" />
                {t("workspace_settings.settings.extra_properties.form.add_option")}
              </Button>
            </div>
          </div>
        )}

        {showCheckboxValues && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("workspace_settings.settings.extra_properties.form.true_value")}
                </label>
                <Input {...register("true_value")} className="w-full" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("workspace_settings.settings.extra_properties.form.false_value")}
                </label>
                <Input {...register("false_value")} className="w-full" />
              </div>
            </div>
            {/* True state extra input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-custom-text-300">
                {t("workspace_settings.settings.extra_properties.form.true_value")}{" "}
                {t("workspace_settings.settings.extra_properties.form.extra_input")}
              </span>
              <Controller
                name="true_extra_input_config"
                control={control}
                render={({ field: f }) => (
                  <CustomSelect
                    value={f.value || ""}
                    onChange={f.onChange}
                    label={
                      availableExtraInputConfigs.find((c) => c.id === f.value)?.label ||
                      t("workspace_settings.settings.extra_properties.form.extra_input_none")
                    }
                    input
                    buttonClassName="min-w-[140px] text-xs"
                  >
                    <CustomSelect.Option value="">
                      {t("workspace_settings.settings.extra_properties.form.extra_input_none")}
                    </CustomSelect.Option>
                    {availableExtraInputConfigs.map((c) => (
                      <CustomSelect.Option key={c.id} value={c.id}>
                        {c.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
              {watch("true_extra_input_config") && (
                <>
                  <span className="text-xs text-custom-text-300">
                    {t("workspace_settings.settings.extra_properties.form.extra_input_required")}
                  </span>
                  <Controller
                    name="true_extra_input_required"
                    control={control}
                    render={({ field: f }) => <ToggleSwitch value={!!f.value} onChange={f.onChange} size="sm" />}
                  />
                </>
              )}
            </div>
            {/* False state extra input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-custom-text-300">
                {t("workspace_settings.settings.extra_properties.form.false_value")}{" "}
                {t("workspace_settings.settings.extra_properties.form.extra_input")}
              </span>
              <Controller
                name="false_extra_input_config"
                control={control}
                render={({ field: f }) => (
                  <CustomSelect
                    value={f.value || ""}
                    onChange={f.onChange}
                    label={
                      availableExtraInputConfigs.find((c) => c.id === f.value)?.label ||
                      t("workspace_settings.settings.extra_properties.form.extra_input_none")
                    }
                    input
                    buttonClassName="min-w-[140px] text-xs"
                  >
                    <CustomSelect.Option value="">
                      {t("workspace_settings.settings.extra_properties.form.extra_input_none")}
                    </CustomSelect.Option>
                    {availableExtraInputConfigs.map((c) => (
                      <CustomSelect.Option key={c.id} value={c.id}>
                        {c.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
              {watch("false_extra_input_config") && (
                <>
                  <span className="text-xs text-custom-text-300">
                    {t("workspace_settings.settings.extra_properties.form.extra_input_required")}
                  </span>
                  <Controller
                    name="false_extra_input_required"
                    control={control}
                    render={({ field: f }) => <ToggleSwitch value={!!f.value} onChange={f.onChange} size="sm" />}
                  />
                </>
              )}
            </div>
            {/* Icon pickers for true/false states */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="mb-1 block text-sm font-medium">True 图标</span>
                <div className="flex items-center gap-2">
                  <Popover className="relative">
                    <Popover.Button
                      as="button"
                      type="button"
                      title={trueIconValue || "选择图标"}
                      className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-custom-border-300 hover:bg-custom-background-80 transition-colors"
                    >
                      {trueIconValue && getLucideIcon(trueIconValue) ? (
                        (() => {
                          const IconComp = getLucideIcon(trueIconValue)!;
                          return <IconComp size={16} color={trueIconColorValue || "#6b7280"} strokeWidth={2} />;
                        })()
                      ) : (
                        <Plus size={14} className="text-custom-text-400" />
                      )}
                    </Popover.Button>
                    <Popover.Panel className="absolute z-50 mt-1 w-72 rounded-lg border border-subtle bg-surface-1 p-3 shadow-raised-200">
                      <Controller
                        name="true_icon"
                        control={control}
                        render={({ field: iconField }) => (
                          <Controller
                            name="true_icon_color"
                            control={control}
                            render={({ field: colorField }) => (
                              <IconColorPicker
                                value={{ name: iconField.value || "", color: colorField.value || "#6b7280" }}
                                onChange={(val) => {
                                  iconField.onChange(val.name || undefined);
                                  colorField.onChange(val.color || undefined);
                                }}
                              />
                            )}
                          />
                        )}
                      />
                    </Popover.Panel>
                  </Popover>
                  {trueIconValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setValue("true_icon", undefined);
                        setValue("true_icon_color", undefined);
                      }}
                      className="text-custom-text-400 hover:text-custom-text-200"
                      title="清除图标"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="mb-1 block text-sm font-medium">False 图标</span>
                <div className="flex items-center gap-2">
                  <Popover className="relative">
                    <Popover.Button
                      as="button"
                      type="button"
                      title={falseIconValue || "选择图标"}
                      className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-custom-border-300 hover:bg-custom-background-80 transition-colors"
                    >
                      {falseIconValue && getLucideIcon(falseIconValue) ? (
                        (() => {
                          const IconComp = getLucideIcon(falseIconValue)!;
                          return <IconComp size={16} color={falseIconColorValue || "#6b7280"} strokeWidth={2} />;
                        })()
                      ) : (
                        <Plus size={14} className="text-custom-text-400" />
                      )}
                    </Popover.Button>
                    <Popover.Panel className="absolute z-50 mt-1 w-72 rounded-lg border border-subtle bg-surface-1 p-3 shadow-raised-200">
                      <Controller
                        name="false_icon"
                        control={control}
                        render={({ field: iconField }) => (
                          <Controller
                            name="false_icon_color"
                            control={control}
                            render={({ field: colorField }) => (
                              <IconColorPicker
                                value={{ name: iconField.value || "", color: colorField.value || "#6b7280" }}
                                onChange={(val) => {
                                  iconField.onChange(val.name || undefined);
                                  colorField.onChange(val.color || undefined);
                                }}
                              />
                            )}
                          />
                        )}
                      />
                    </Popover.Panel>
                  </Popover>
                  {falseIconValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setValue("false_icon", undefined);
                        setValue("false_icon_color", undefined);
                      }}
                      className="text-custom-text-400 hover:text-custom-text-200"
                      title="清除图标"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showMemberColor && (
          <div className="flex flex-col gap-2">
            <span className="text-body-sm-medium text-secondary">头像颜色（可选）</span>
            <div className="flex items-center gap-2">
              <Popover className="relative">
                <Popover.Button as="div" className="cursor-pointer">
                  <div
                    className="h-6 w-6 rounded-full border border-custom-border-200"
                    style={{ background: memberColorValue || "#6b7280" }}
                  />
                </Popover.Button>
                <Popover.Panel className="absolute z-10 left-0 mt-1">
                  <Controller
                    name="member_color"
                    control={control}
                    render={({ field: colorField }) => (
                      <IconColorPicker
                        value={{ name: "", color: colorField.value || "#6b7280" }}
                        onChange={(val) => colorField.onChange(val.color || undefined)}
                      />
                    )}
                  />
                </Popover.Panel>
              </Popover>
              <span className="text-body-xs-regular text-tertiary">{memberColorValue || "未设置（使用默认样式）"}</span>
              {memberColorValue && (
                <button
                  type="button"
                  onClick={() => setValue("member_color", undefined)}
                  className="text-custom-text-400 hover:text-custom-text-200"
                  title="清除颜色"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isEditMode ? t("common.update") : t("common.create")}
          </Button>
        </div>
      </div>
    </form>
  );
});
