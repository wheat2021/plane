import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { CircleAlert, XCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IEmailCheckData } from "@plane/types";
import { Input, Spinner } from "@plane/ui";
import { cn, checkEmailValidity } from "@plane/utils";
// helpers
type TAuthEmailForm = {
  defaultEmail: string;
  onSubmit: (data: IEmailCheckData) => Promise<void>;
};

export const AuthEmailForm = observer(function AuthEmailForm(props: TAuthEmailForm) {
  const { onSubmit, defaultEmail } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  // plane hooks
  const { t } = useTranslation();
  const isEmployeeId = /^\d{6}$/.test(email);
  const emailError = useMemo(
    () =>
      email && !isEmployeeId && !checkEmailValidity(email) ? { email: "auth.common.email.errors.invalid" } : undefined,
     
    [email, isEmployeeId]
  );

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const payload: IEmailCheckData = {
      email: email,
    };
    await onSubmit(payload);
    setIsSubmitting(false);
  };

  const isButtonDisabled = email.length === 0 || Boolean(emailError?.email) || isSubmitting;

  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-13 text-tertiary font-medium">
          {t("auth.common.email.label")}
        </label>
        <div
          className={cn(
            `relative flex items-center rounded-md bg-surface-1 border`,
            !isFocused && Boolean(emailError?.email) ? `border-danger-strong` : `border-strong`
          )}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
        >
          <Input
            id="email"
            name="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.common.email.placeholder")}
            className={`disable-autofill-style h-10 w-full placeholder:text-placeholder autofill:bg-danger-primary border-0 focus:bg-none active:bg-transparent`}
            autoComplete="on"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            ref={inputRef}
          />
          {email.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEmail("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 size-5 grid place-items-center"
              aria-label={t("aria_labels.auth_forms.clear_email")}
              tabIndex={-1}
            >
              <XCircle className="size-5 stroke-placeholder" />
            </button>
          )}
        </div>
        {emailError?.email && !isFocused && (
          <p className="flex items-center gap-1 text-11 text-danger-primary px-0.5">
            <CircleAlert height={12} width={12} />
            {t(emailError.email)}
          </p>
        )}
      </div>
      <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
        {isSubmitting ? <Spinner height="20px" width="20px" /> : t("common.continue")}
      </Button>
    </form>
  );
});
