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

/**
 * Auto-calculates the complete 20-month schedule for a Fixed Chit Plan.
 * Rule:
 * - 20 months, 20 members
 * - Gross Due = Chit Value / 20
 * - Month 1 Payout = 95% of Chit Value
 * - Each subsequent month increments payout by 1% of Chit Value (Month 20 = 114%)
 * - Post-draw additional monthly fee = 1% of Chit Value
 * - Revised due after winning chit = Gross Due + (1% of Chit Value)
 */
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

// Standard Tamil Nadu 20-Month Reverse Auction Discount percentages
const defaultDiscountSchedule = [
  5,   // Month 1 (Foreman Chit: 5% commission, full net payout)
  30,  // Month 2 (Max Auction Cap: 30%)
  28,  // Month 3
  26,  // Month 4
  24,  // Month 5
  22,  // Month 6
  20,  // Month 7
  18,  // Month 8
  16,  // Month 9
  15,  // Month 10
  14,  // Month 11
  13,  // Month 12
  12,  // Month 13
  11,  // Month 14
  10,  // Month 15
  9,   // Month 16
  8,   // Month 17
  7,   // Month 18
  6,   // Month 19
  5,   // Month 20 (Foreman commission only)
];

/**
 * Auto-calculates the complete 20-month schedule for an Auction Chit Plan.
 * Rule:
 * - 20 months, 20 members
 * - Gross Due = Chit Value / 20
 * - Foreman Commission = 5% of Chit Value
 * - Divisible discount = Total Bid Discount - Foreman Commission
 * - Dividend per member = Divisible discount / 20
 * - Net Due = Gross Due - Dividend per member
 * - Payout = Chit Value - Total Bid Discount
 */
export const calculateAuctionPlanSchedule = (chitValue: number, months: number = 20): AuctionPlanDetails => {
  const members = months;
  const grossDue = Math.round(chitValue / months);
  const commission = Math.round(chitValue * 0.05);

  const schedule: AuctionMonthRow[] = [];
  let totalInvested = 0;
  let totalDividends = 0;

  for (let m = 1; m <= months; m++) {
    const discountPct = defaultDiscountSchedule[m - 1] ?? 5;
    const totalDiscount = Math.round(chitValue * (discountPct / 100));
    const payout = chitValue - totalDiscount;

    let dividend = 0;
    if (m === 1 || discountPct <= 5) {
      dividend = 0;
    } else {
      const divisibleDiscount = Math.max(0, totalDiscount - commission);
      dividend = Math.round(divisibleDiscount / members);
    }

    const netDue = grossDue - dividend;
    totalInvested += netDue;
    totalDividends += dividend;

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

  const netDues = schedule.map(r => r.netDue);
  const payouts = schedule.map(r => r.payout);

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
