export interface FixedMonthRow {
  month: number;
  due: number;
  payout: number;
}

export interface FixedPlanDetails {
  chitValue: number;
  months: number;
  members: number;
  monthlyDue: number;
  postDrawFee: number;
  postDrawTotalDue: number;
  minPayout: number;
  maxPayout: number;
  schedule: FixedMonthRow[];
}

export interface AuctionMonthRow {
  month: number;
  discountPct: number;
  totalDiscount: number;
  payout: number;
  commission: number;
  dividend: number;
  netDue: number;
}

export interface AuctionPlanDetails {
  chitValue: number;
  months: number;
  members: number;
  grossDue: number;
  commission: number;
  minNetDue: number;
  maxNetDue: number;
  minPayout: number;
  maxPayout: number;
  totalInvested: number;
  totalDividends: number;
  schedule: AuctionMonthRow[];
}

export const calculateFixedPlanSchedule = (chitValue: number, months: number = 20): FixedPlanDetails => {
  const members = months;
  const monthlyDue = Math.round(chitValue / months);
  const postDrawFee = Math.round(chitValue * 0.01);
  const postDrawTotalDue = monthlyDue + postDrawFee;

  const schedule: FixedMonthRow[] = [];
  for (let m = 1; m <= months; m++) {
    const payoutMultiplier = 0.95 + (m - 1) * 0.01;
    const payout = Math.round(chitValue * payoutMultiplier);
    schedule.push({
      month: m,
      due: monthlyDue,
      payout,
    });
  }

  return {
    chitValue,
    months,
    members,
    monthlyDue,
    postDrawFee,
    postDrawTotalDue,
    minPayout: schedule[0]?.payout || Math.round(chitValue * 0.95),
    maxPayout: schedule[months - 1]?.payout || Math.round(chitValue * 1.14),
    schedule,
  };
};

const defaultDiscountSchedule = [
  5, 30, 28, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5
];

export const calculateAuctionPlanSchedule = (chitValue: number, months: number = 20): AuctionPlanDetails => {
  const members = months;
  const grossDue = Math.round(chitValue / months);
  const commission = Math.round(chitValue * 0.05);

  const schedule: AuctionMonthRow[] = [];
  let totalDividends = 0;
  let totalInvested = 0;

  for (let m = 1; m <= months; m++) {
    const discountPct = defaultDiscountSchedule[m - 1] ?? 5;
    const totalDiscount = Math.round(chitValue * (discountPct / 100));
    const payout = chitValue - totalDiscount;

    let dividend = 0;
    if (m === 1) {
      dividend = 0;
    } else {
      const distributable = totalDiscount - commission;
      dividend = Math.round(distributable / members);
    }

    const netDue = grossDue - dividend;
    totalDividends += dividend;
    totalInvested += netDue;

    schedule.push({
      month: m,
      discountPct,
      totalDiscount,
      payout,
      commission,
      dividend,
      netDue,
    });
  }

  const netDues = schedule.map((r) => r.netDue);
  const payouts = schedule.map((r) => r.payout);

  return {
    chitValue,
    months,
    members,
    grossDue,
    commission,
    minNetDue: Math.min(...netDues),
    maxNetDue: Math.max(...netDues),
    minPayout: Math.min(...payouts),
    maxPayout: Math.max(...payouts),
    totalInvested,
    totalDividends,
    schedule,
  };
};

export const calculateRegularPlanSchedule = (chitValue: number) => {
  return calculateAuctionPlanSchedule(chitValue, 20);
};

export const defaultRegularCategories = [
  { id: 1, value: 100000 },
  { id: 2, value: 200000 },
  { id: 3, value: 500000 },
  { id: 4, value: 1000000 },
];

export const defaultFixedCategories = [
  { id: 1, value: 100000 },
  { id: 2, value: 200000 },
  { id: 3, value: 500000 },
  { id: 4, value: 1000000 },
];

export const defaultAuctionCategories = [
  { id: 1, value: 100000 },
  { id: 2, value: 200000 },
  { id: 3, value: 500000 },
  { id: 4, value: 1000000 },
];
