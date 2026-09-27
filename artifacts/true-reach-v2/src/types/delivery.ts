export type CheckStatus = 'verified' | 'not_detected' | 'flag' | 'unknown';

export type DeliveryCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string | null;
  timestamps: Array<{ start: number; end?: number | null }>;
};

export type ContractRequirements = {
  brandVariants?: string[];
  minMentions?: number;
  productShown?: boolean;
  disclosureRequired?: boolean;
  competitors?: string[];
  requiredPhrase?: string | null;
  discountCode?: string | null;
  requiredCta?: string | null;
  minDurationSeconds?: number | null;
  maxDurationSeconds?: number | null;
};

export function formatCheckTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const STATUS_LABELS: Record<CheckStatus, string> = {
  verified: 'Verified',
  not_detected: 'Not detected',
  flag: 'Flag',
  unknown: 'Unknown',
};

export const CERAVE_REQUIREMENTS: ContractRequirements = {
  brandVariants: ['CeraVe', 'Cera V'],
  minMentions: 2,
  productShown: true,
  disclosureRequired: true,
  competitors: ['Cetaphil'],
};
