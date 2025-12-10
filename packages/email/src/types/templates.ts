export interface CommonEmailProps {
  readonly locale?: string;
}

const AuthEmailTemplate = {
  RESET_PASSWORD: "reset-password",
  MAGIC_LINK: "magic-link",
  CONFIRM_EMAIL: "confirm-email",
  DELETE_ACCOUNT: "delete-account",
  CHANGE_EMAIL: "change-email",
  ORGANIZATION_INVITATION: "organization-invitation",
} as const;

type AuthEmailTemplate =
  (typeof AuthEmailTemplate)[keyof typeof AuthEmailTemplate];

type AuthEmailVariables = Record<
  Exclude<AuthEmailTemplate, typeof EmailTemplate.ORGANIZATION_INVITATION>,
  {
    url: string;
  }
>;

export const EmailTemplate = {
  ...AuthEmailTemplate,
  CONTACT_FORM: "contact-form",
  SANTACALL_ORDER_CONFIRMATION: "santacall-order-confirmation",
  SANTACALL_VIDEO_READY: "santacall-video-ready",
  SANTACALL_CALL_LINK: "santacall-call-link",
  SANTACALL_CALL_COMPLETED: "santacall-call-completed",
} as const;

export type EmailTemplate = (typeof EmailTemplate)[keyof typeof EmailTemplate];

export type EmailVariables = AuthEmailVariables & {
  [EmailTemplate.CHANGE_EMAIL]: {
    url: string;
    newEmail: string;
  };
  [EmailTemplate.ORGANIZATION_INVITATION]: {
    url: string;
    inviter: string;
    organization: string;
  };
  [EmailTemplate.CONTACT_FORM]: {
    name: string;
    email: string;
    message: string;
  };
  [EmailTemplate.SANTACALL_ORDER_CONFIRMATION]: {
    customerName: string;
    childName: string;
    orderNumber: string;
    orderType: "video" | "call";
    amountPaid: string;
    scheduledAt?: string;
    timezone?: string;
    orderUrl: string;
  };
  [EmailTemplate.SANTACALL_VIDEO_READY]: {
    customerName: string;
    childName: string;
    viewUrl: string;
  };
  [EmailTemplate.SANTACALL_CALL_LINK]: {
    customerName: string;
    childName: string;
    joinUrl: string;
    scheduledAt: string;
    timezone: string;
  };
  [EmailTemplate.SANTACALL_CALL_COMPLETED]: {
    customerName: string;
    childName: string;
    orderNumber: string;
    durationMinutes: number;
  };
};
