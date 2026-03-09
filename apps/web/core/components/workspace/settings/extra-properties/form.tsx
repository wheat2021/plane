"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TExtraPropertyConfigPayload, TExtraPropertyType } from "@plane/types";
import { Button, CustomSelect, Input, TextArea } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useExtraPropertyConfig } from "@/hooks/store/use-extra-property-config";

type Props = {
  configId: string | null;
  onClose: () => void;
};

type FormValues = {
  key: string;
  label: string;
  type: TExtraPropertyType;
  description: string;
  options: { value: string; label: string }[];
  true_value: string;
  false_value: string;
};

const PROPERTY_TYPES: { value: TExtraPropertyType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "checkbox", label: "Checkbox" },
];

export const ExtraPropertyForm = observer(function ExtraPropertyForm({ configId, onClose }: Props) {
  // params
  const { workspaceSlug } = useParams();
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // store hooks
  const { getConfigById, createConfig, updateConfig } = useExtraPropertyConfig();
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
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      key: "",
      label: "",
      type: "text",
      description: "",
      options: [{ value: "", label: "" }],
      true_value: "Yes",
      false_value: "No",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const selectedType = watch("type");
  const showOptions = selectedType === "select" || selectedType === "multiselect";
  const showCheckboxValues = selectedType === "checkbox";

  useEffect(() => {
    if (existingConfig) {
      reset({
        key: existingConfig.key,
        label: existingConfig.label,
        type: existingConfig.type,
        description: existingConfig.description || "",
        options: existingConfig.options?.length
          ? existingConfig.options.map((o) => ({ value: o.value, label: o.label || "" }))
          : [{ value: "", label: "" }],
        true_value: existingConfig.true_value || "Yes",
        false_value: existingConfig.false_value || "No",
      });
    }
  }, [existingConfig, reset]);

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
          }));
      }

      if (showCheckboxValues) {
        payload.true_value = data.true_value;
        payload.false_value = data.false_value;
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
                disabled={isEditMode}
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
                <div key={field.id} className="flex items-center gap-2">
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
              ))}
              <Button
                variant="link-neutral"
                size="sm"
                onClick={() => append({ value: "", label: "" })}
                className="self-start"
              >
                <Plus className="size-4 mr-1" />
                {t("workspace_settings.settings.extra_properties.form.add_option")}
              </Button>
            </div>
          </div>
        )}

        {showCheckboxValues && (
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
