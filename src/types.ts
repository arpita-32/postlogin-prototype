export interface Biller {
  slNo: number;
  name: string;
  authenticators: string;
  nickName: string;
  pendingBills: number;
  billStatus?: 'Paid' | 'Unpaid' | 'Scheduled' | 'Expired';
  dueDate?: string;
  category?: string;
}

export type NavTab = 'home' | 'my-billers' | 'payments' | 'scheduled' | 'complaints';

export type CategoryId = 
  | 'electricity'
  | 'mobile-postpaid'
  | 'mobile-prepaid'
  | 'dth'
  | 'landline-postpaid'
  | 'broadband-postpaid'
  | 'gas'
  | 'water'
  | 'municipal-taxes'
  | 'insurance'
  | 'credit-card'
  | 'rental'
  | 'loan-repayment'
  | 'education-fees'
  | 'donation'
  | 'subscription'
  | 'fastag'
  | 'lpg-gas'
  | 'cable-tv'
  | 'municipal-services'
  | 'housing-society'
  | 'clubs-associations'
  | 'ncmc-recharge'
  | 'prepaid-meter'
  | 'national-pension'
  | 'agent-collection'
  | 'echallan'
  | 'ev-recharge'
  | 'tourism'
  | 'local-commute'
  | 'credit-line-upi';

export interface CategoryItem {
  id: CategoryId;
  title: string;
  iconName: string;
  isNew?: boolean;
}

export type BillStatus = 'Paid' | 'Unpaid' | 'Scheduled' | 'Expired';

export interface PendingBill {
  id: string;
  billerName: string;
  category: string;
  amount: number;
  status: BillStatus;
  dueDate?: string;
  scheduledDate?: string;
  consumerNumber?: string;
  accountName?: string;
  earlyPaymentDate?: string;
  earlyPaymentAmount?: number;
  latePaymentDate?: string;
  latePaymentAmount?: number;
}

export interface BillerOption {
  id: string;
  name: string;
  logo: string;
  category: CategoryId;
  authenticatorLabel: string;
  authenticatorPlaceholder: string;
  sampleConsumerNo: string;
}

export interface SavedBiller {
  slNo: number;
  billerName: string;
  billerLogo: string;
  authenticator: string;
  nickName: string;
  pendingBills: string;
}

export interface RechargePlan {
  id: string;
  amount: number;
  benefits: string;
  validity: string;
  data: string;
  voice: string;
  sms: string;
  category: 'Popular' | 'Unlimited' | 'Data' | 'Talktime' | 'Validity' | 'Top Up';
  recommended?: boolean;
}

export interface Transaction {
  slNo?: number;
  txnId?: string;
  refId?: string;
  billerName: string;
  category: string;
  amount: number;
  date: string;
  dateTime?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'Successful' | 'Failed' | string;
  accountDetails?: string;
  subscriberNumber?: string;
  billerStatus?: 'SUCCESS' | 'FAILED' | string;
  convenienceFee?: number;
  txnRefNo?: string;
  paymentType?: string;
  paymentMethod?: string;
  paymentMode?: string;
  billerLogoCode?: string;
  bbpsRefNo?: string;
  // Category-specific details for Local Commute & Tourism
  journeyDetails?: {
    source: string;
    destination: string;
    route: string;
    transitMode: string;
    lineName: string;
    travellers: number;
    journeyType: string;
    validTill: string;
    qrData?: string;
    fare: number;
  };
  tourismDetails?: {
    city: string;
    state: string;
    visitDate: string;
    destinations: string[];
    slotTime: string;
    adults: number;
    children: number;
    totalPasses: number;
    qrData?: string;
    fare: number;
  };
}
