import type { ReactNode } from "react";
// plane imports
import type { TAuthErrorInfo } from "@plane/constants";
import { E_PASSWORD_STRENGTH, EErrorAlertType, EAuthErrorCodes } from "@plane/constants";

/**
 * @description Password strength levels
 */
export enum PasswordStrength {
  EMPTY = "empty",
  WEAK = "weak",
  FAIR = "fair",
  GOOD = "good",
  STRONG = "strong",
}

/**
 * Calculate password strength based on various criteria
 */
export const getPasswordStrength = (password: string): E_PASSWORD_STRENGTH => {
  if (!password || password === "" || password.length <= 0) {
    return E_PASSWORD_STRENGTH.EMPTY;
  }

  if (password.length < 8) {
    return E_PASSWORD_STRENGTH.LENGTH_NOT_VALID;
  }

  // Check all criteria
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()\-_+=[{}|;:'",.<>?/]/.test(password);

  if (hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar) {
    return E_PASSWORD_STRENGTH.STRENGTH_VALID;
  }

  return E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID;
};

export type PasswordCriteria = {
  key: string;
  label: string;
  isValid: boolean;
};

/**
 * Get password criteria for validation display
 */
export const getPasswordCriteria = (password: string): PasswordCriteria[] => [
  {
    key: "length",
    label: "至少 8 个字符",
    isValid: password.length >= 8,
  },
  {
    key: "uppercase",
    label: "至少 1 个大写字母",
    isValid: /[A-Z]/.test(password),
  },
  {
    key: "lowercase",
    label: "至少 1 个小写字母",
    isValid: /[a-z]/.test(password),
  },
  {
    key: "number",
    label: "至少 1 个数字",
    isValid: /[0-9]/.test(password),
  },
  {
    key: "special",
    label: "至少 1 个特殊字符",
    isValid: /[!@#$%^&*()\-_+=[{}|;:'",.<>?/]/.test(password),
  },
];

// Error code messages
const errorCodeMessages: {
  [key in EAuthErrorCodes]: { title: string; message: (email?: string) => ReactNode };
} = {
  // global
  [EAuthErrorCodes.INSTANCE_NOT_CONFIGURED]: {
    title: `系统未配置`,
    message: () => `系统尚未配置，请联系管理员。`,
  },
  [EAuthErrorCodes.SIGNUP_DISABLED]: {
    title: `注册已禁用`,
    message: () => `注册功能已禁用，请联系管理员。`,
  },
  [EAuthErrorCodes.INVALID_PASSWORD]: {
    title: `密码错误`,
    message: () => `密码错误，请重试。`,
  },
  [EAuthErrorCodes.SMTP_NOT_CONFIGURED]: {
    title: `邮件服务未配置`,
    message: () => `邮件服务未配置，请联系管理员。`,
  },
  // email check in both sign up and sign in
  [EAuthErrorCodes.INVALID_EMAIL]: {
    title: `邮箱格式错误`,
    message: () => `邮箱格式错误，请重试。`,
  },
  [EAuthErrorCodes.EMAIL_REQUIRED]: {
    title: `邮箱不能为空`,
    message: () => `邮箱不能为空，请重试。`,
  },
  // sign up
  [EAuthErrorCodes.USER_ALREADY_EXIST]: {
    title: `账号已存在`,
    message: () => `该账号已注册，请直接登录。`,
  },
  [EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP]: {
    title: `邮箱和密码不能为空`,
    message: () => `邮箱和密码不能为空，请重试。`,
  },
  [EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP]: {
    title: `验证失败`,
    message: () => `验证失败，请重试。`,
  },
  [EAuthErrorCodes.INVALID_EMAIL_SIGN_UP]: {
    title: `邮箱格式错误`,
    message: () => `邮箱格式错误，请重试。`,
  },
  [EAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED]: {
    title: `邮箱和验证码不能为空`,
    message: () => `邮箱和验证码不能为空，请重试。`,
  },
  [EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP]: {
    title: `邮箱格式错误`,
    message: () => `邮箱格式错误，请重试。`,
  },
  // sign in
  [EAuthErrorCodes.USER_ACCOUNT_DEACTIVATED]: {
    title: `账号已停用`,
    message: () => `账号已停用，请联系管理员。`,
  },
  [EAuthErrorCodes.USER_DOES_NOT_EXIST]: {
    title: `账号不存在`,
    message: () => `未找到该账号，请联系管理员。`,
  },
  [EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN]: {
    title: `邮箱和密码不能为空`,
    message: () => `邮箱和密码不能为空，请重试。`,
  },
  [EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN]: {
    title: `验证失败`,
    message: () => `验证失败，请重试。`,
  },
  [EAuthErrorCodes.INVALID_EMAIL_SIGN_IN]: {
    title: `邮箱格式错误`,
    message: () => `邮箱格式错误，请重试。`,
  },
  [EAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED]: {
    title: `邮箱和验证码不能为空`,
    message: () => `邮箱和验证码不能为空，请重试。`,
  },
  [EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN]: {
    title: `邮箱格式错误`,
    message: () => `邮箱格式错误，请重试。`,
  },
  // Both Sign in and Sign up
  [EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN]: {
    title: `验证失败`,
    message: () => `验证码无效，请重试。`,
  },
  [EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP]: {
    title: `验证失败`,
    message: () => `验证码无效，请重试。`,
  },
  [EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN]: {
    title: `验证码已过期`,
    message: () => `验证码已过期，请重试。`,
  },
  [EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP]: {
    title: `验证码已过期`,
    message: () => `验证码已过期，请重试。`,
  },
  [EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN]: {
    title: `验证码已过期`,
    message: () => `验证码已过期，请重试。`,
  },
  [EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP]: {
    title: `验证码已过期`,
    message: () => `验证码已过期，请重试。`,
  },
  // Oauth
  [EAuthErrorCodes.OAUTH_NOT_CONFIGURED]: {
    title: `OAuth 未配置`,
    message: () => `OAuth 未配置，请联系管理员。`,
  },
  [EAuthErrorCodes.GOOGLE_NOT_CONFIGURED]: {
    title: `Google 登录未配置`,
    message: () => `Google 登录未配置，请联系管理员。`,
  },
  [EAuthErrorCodes.GITHUB_NOT_CONFIGURED]: {
    title: `GitHub 登录未配置`,
    message: () => `GitHub 登录未配置，请联系管理员。`,
  },
  [EAuthErrorCodes.GITLAB_NOT_CONFIGURED]: {
    title: `GitLab 登录未配置`,
    message: () => `GitLab 登录未配置，请联系管理员。`,
  },
  [EAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: {
    title: `Google 登录出错`,
    message: () => `Google 登录出错，请重试。`,
  },
  [EAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: {
    title: `GitHub 登录出错`,
    message: () => `GitHub 登录出错，请重试。`,
  },
  [EAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR]: {
    title: `GitLab 登录出错`,
    message: () => `GitLab 登录出错，请重试。`,
  },
  // Reset Password
  [EAuthErrorCodes.INVALID_PASSWORD_TOKEN]: {
    title: `重置链接无效`,
    message: () => `重置链接无效，请重试。`,
  },
  [EAuthErrorCodes.EXPIRED_PASSWORD_TOKEN]: {
    title: `重置链接已过期`,
    message: () => `重置链接已过期，请重试。`,
  },
  // Change password
  [EAuthErrorCodes.MISSING_PASSWORD]: {
    title: `密码不能为空`,
    message: () => `密码不能为空，请重试。`,
  },
  [EAuthErrorCodes.INCORRECT_OLD_PASSWORD]: {
    title: `原密码错误`,
    message: () => `原密码错误，请重试。`,
  },
  [EAuthErrorCodes.INVALID_NEW_PASSWORD]: {
    title: `新密码无效`,
    message: () => `新密码无效，请重试。`,
  },
  // set password
  [EAuthErrorCodes.PASSWORD_ALREADY_SET]: {
    title: `密码已设置`,
    message: () => `密码已设置，请重试。`,
  },
  // admin
  [EAuthErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: `管理员已存在`,
    message: () => `管理员账号已存在，请重试。`,
  },
  [EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: `必填信息不完整`,
    message: () => `邮箱、密码和姓名均为必填项，请重试。`,
  },
  [EAuthErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: `管理员邮箱格式错误`,
    message: () => `管理员邮箱格式错误，请重试。`,
  },
  [EAuthErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: `管理员密码无效`,
    message: () => `管理员密码无效，请重试。`,
  },
  [EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: `邮箱和密码不能为空`,
    message: () => `邮箱和密码不能为空，请重试。`,
  },
  [EAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: `验证失败`,
    message: () => `验证失败，请重试。`,
  },
  [EAuthErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
    title: `管理员账号已存在`,
    message: () => `管理员账号已存在，请直接登录。`,
  },
  [EAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
    title: `管理员账号不存在`,
    message: () => `管理员账号不存在，请联系管理员。`,
  },
  [EAuthErrorCodes.MAGIC_LINK_LOGIN_DISABLED]: {
    title: `邮件链接登录已禁用`,
    message: () => `邮件链接登录已禁用，请使用密码登录。`,
  },
  [EAuthErrorCodes.PASSWORD_LOGIN_DISABLED]: {
    title: `密码登录已禁用`,
    message: () => `密码登录已禁用，请使用邮件链接登录。`,
  },
  [EAuthErrorCodes.ADMIN_USER_DEACTIVATED]: {
    title: `管理员账号已停用`,
    message: () => `管理员账号已停用，请联系管理员。`,
  },
  [EAuthErrorCodes.RATE_LIMIT_EXCEEDED]: {
    title: `请求过于频繁`,
    message: () => `请求过于频繁，请稍后重试。`,
  },
};

// Error handler
export const authErrorHandler = (errorCode: EAuthErrorCodes, email?: string): TAuthErrorInfo | undefined => {
  const bannerAlertErrorCodes = [
    EAuthErrorCodes.INSTANCE_NOT_CONFIGURED,
    EAuthErrorCodes.INVALID_EMAIL,
    EAuthErrorCodes.EMAIL_REQUIRED,
    EAuthErrorCodes.SIGNUP_DISABLED,
    EAuthErrorCodes.INVALID_PASSWORD,
    EAuthErrorCodes.SMTP_NOT_CONFIGURED,
    EAuthErrorCodes.USER_ALREADY_EXIST,
    EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_UP,
    EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP,
    EAuthErrorCodes.INVALID_EMAIL_SIGN_UP,
    EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP,
    EAuthErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED,
    EAuthErrorCodes.USER_DOES_NOT_EXIST,
    EAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN,
    EAuthErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN,
    EAuthErrorCodes.INVALID_EMAIL_SIGN_IN,
    EAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
    EAuthErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED,
    EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
    EAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_UP,
    EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
    EAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP,
    EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
    EAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP,
    EAuthErrorCodes.OAUTH_NOT_CONFIGURED,
    EAuthErrorCodes.GOOGLE_NOT_CONFIGURED,
    EAuthErrorCodes.GITHUB_NOT_CONFIGURED,
    EAuthErrorCodes.GITLAB_NOT_CONFIGURED,
    EAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
    EAuthErrorCodes.INVALID_PASSWORD_TOKEN,
    EAuthErrorCodes.EXPIRED_PASSWORD_TOKEN,
    EAuthErrorCodes.INCORRECT_OLD_PASSWORD,
    EAuthErrorCodes.INVALID_NEW_PASSWORD,
    EAuthErrorCodes.PASSWORD_ALREADY_SET,
    EAuthErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAuthErrorCodes.INVALID_ADMIN_EMAIL,
    EAuthErrorCodes.INVALID_ADMIN_PASSWORD,
    EAuthErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAuthErrorCodes.ADMIN_AUTHENTICATION_FAILED,
    EAuthErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EAuthErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
    EAuthErrorCodes.USER_ACCOUNT_DEACTIVATED,
  ];

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.BANNER_ALERT,
      code: errorCode,
      title: errorCodeMessages[errorCode]?.title || "Error",
      message: errorCodeMessages[errorCode]?.message(email) || "Something went wrong. Please try again.",
    };

  return undefined;
};
