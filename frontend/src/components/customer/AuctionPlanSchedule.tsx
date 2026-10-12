import { useState } from 'react';
import { Calendar, ShieldCheck, HelpCircle } from 'lucide-react';

interface AuctionMonthSchedule {
  month: number;
  discountPct: number;
  // 1L
  due1: number;
  div1: number;
  pay1: number;
  // 2L
  due2: number;
  div2: number;
  pay2: number;
  // 5L
  due5: number;
  div5: number;
  pay5: number;
  // 10L
  due10: number;
  div10: number;
  pay10: number;
}

// 20 Months Tamil Nadu Standard Auction Chit Model
// 5% Foreman commission. Divisible discount = (Bid Discount - 5%) distributed to 20 members as dividend.
const auctionScheduleData: AuctionMonthSchedule[] = [
  { month: 1, discountPct: 5, due1: 5000, div1: 0, pay1: 95000, due2: 10000, div2: 0, pay2: 190000, due5: 25000, div5: 0, pay5: 475000, due10: 50000, div10: 0, pay10: 950000 },
  { month: 2, discountPct: 30, due1: 3750, div1: 1250, pay1: 70000, due2: 7500, div2: 2500, pay2: 140000, due5: 18750, div5: 6250, pay5: 350000, due10: 37500, div10: 12500, pay10: 700000 },
  { month: 3, discountPct: 28, due1: 3850, div1: 1150, pay1: 72000, due2: 7700, div2: 2300, pay2: 144000, due5: 19250, div5: 5750, pay5: 360000, due10: 38500, div10: 11500, pay10: 720000 },
  { month: 4, discountPct: 26, due1: 3950, div1: 1050, pay1: 74000, due2: 7900, div2: 2100, pay2: 148000, due5: 19750, div5: 5250, pay5: 370000, due10: 39500, div10: 10500, pay10: 740000 },
  { month: 5, discountPct: 24, due1: 4050, div1: 950, pay1: 76000, due2: 8100, div2: 1900, pay2: 152000, due5: 20250, div5: 4750, pay5: 380000, due10: 40500, div10: 9500, pay10: 760000 },
  { month: 6, discountPct: 22, due1: 4150, div1: 850, pay1: 78000, due2: 8300, div2: 1700, pay2: 156000, due5: 20750, div5: 4250, pay5: 390000, due10: 41500, div10: 8500, pay10: 780000 },
  { month: 7, discountPct: 20, due1: 4250, div1: 750, pay1: 80000, due2: 8500, div2: 1500, pay2: 160000, due5: 21250, div5: 3750, pay5: 400000, due10: 42500, div10: 7500, pay10: 800000 },
  { month: 8, discountPct: 18, due1: 4350, div1: 650, pay1: 82000, due2: 8700, div2: 1300, pay2: 164000, due5: 21750, div5: 3250, pay5: 410000, due10: 43500, div10: 6500, pay10: 820000 },
  { month: 9, discountPct: 16, due1: 4450, div1: 550, pay1: 84000, due2: 8900, div2: 1100, pay2: 168000, due5: 22250, div5: 2750, pay5: 420000, due10: 44500, div10: 5500, pay10: 840000 },
  { month: 10, discountPct: 15, due1: 4500, div1: 500, pay1: 85000, due2: 9000, div2: 1000, pay2: 170000, due5: 22500, div5: 2500, pay5: 425000, due10: 45000, div10: 5000, pay10: 850000 },
  { month: 11, discountPct: 14, due1: 4550, div1: 450, pay1: 86000, due2: 9100, div2: 900, pay2: 172000, due5: 22750, div5: 2250, pay5: 430000, due10: 45500, div10: 4500, pay10: 860000 },
  { month: 12, discountPct: 13, due1: 4600, div1: 400, pay1: 87000, due2: 9200, div2: 800, pay2: 174000, due5: 23000, div5: 2000, pay5: 435000, due10: 46000, div10: 4000, pay10: 870000 },
  { month: 13, discountPct: 12, due1: 4650, div1: 350, pay1: 88000, due2: 9300, div2: 700, pay2: 176000, due5: 23250, div5: 1750, pay5: 440000, due10: 46500, div10: 3500, pay10: 880000 },
  { month: 14, discountPct: 11, due1: 4700, div1: 300, pay1: 89000, due2: 9400, div2: 600, pay2: 178000, due5: 23500, div5: 1500, pay5: 445000, due10: 47000, div10: 3000, pay10: 890000 },
  { month: 15, discountPct: 10, due1: 4750, div1: 250, pay1: 90000, due2: 9500, div2: 500, pay2: 180000, due5: 23750, div5: 1250, pay5: 450000, due10: 47500, div10: 2500, pay10: 900000 },
  { month: 16, discountPct: 9, due1: 4800, div1: 200, pay1: 91000, due2: 9600, div2: 400, pay2: 182000, due5: 24000, div5: 1000, pay5: 455000, due10: 48000, div10: 2000, pay10: 910000 },
  { month: 17, discountPct: 8, due1: 4850, div1: 150, pay1: 92000, due2: 9700, div2: 300, pay2: 184000, due5: 24250, div5: 750, pay5: 460000, due10: 48500, div10: 1500, pay10: 920000 },
  { month: 18, discountPct: 7, due1: 4900, div1: 100, pay1: 93000, due2: 9800, div2: 200, pay2: 186000, due5: 24500, div5: 500, pay5: 465000, due10: 49000, div10: 1000, pay10: 930000 },
  { month: 19, discountPct: 6, due1: 4950, div1: 50, pay1: 94000, due2: 9900, div2: 100, pay2: 188000, due5: 24750, div5: 250, pay5: 470000, due10: 49500, div10: 500, pay10: 940000 },
  { month: 20, discountPct: 5, due1: 5000, div1: 0, pay1: 95000, due2: 10000, div2: 0, pay2: 190000, due5: 25000, div5: 0, pay5: 475000, due10: 50000, div10: 0, pay10: 950000 },
];

const auctionRules = [
  {
    title: 'தலைகீழ் ஏல முறை (Reverse Auction)',
    tamil: 'தேவை உள்ள உறுப்பினர்கள் ஏலத்தில் கலந்து கொண்டு குறைந்த தொகையை (அதிக தள்ளுபடி) கேட்பவருக்கு அந்த மாத சீட்டு வழங்கப்படும்.',
    english: 'Members with fund requirements participate in a reverse bid. The lowest bidder (highest discount) wins the prize money.'
  },
  {
    title: 'உச்ச வரம்பு தள்ளுபடி (30% Max Ceiling)',
    tamil: 'சீட்டுத் தொகையில் அதிகபட்ச தள்ளுபடி 30% ஆகும். ஒன்றுக்கும் மேற்பட்டோர் சமமாக ஏலம் கேட்டால் குலுக்கல் (Lottery) மூலம் வெற்றியாளர் தேர்வு செய்யப்படுவர்.',
    english: 'Maximum bid discount is capped at 30%. If multiple members bid the max discount, the winner is decided by a transparent draw.'
  },
  {
    title: 'டிவிடெண்ட் லாபப் பகிர்வு (Monthly Dividend)',
    tamil: 'ஏலத் தள்ளுபடியில் 5% நிறுவன கமிஷன் கழித்து, மீதமுள்ள தொகை அனைத்து 20 உறுப்பினர்களுக்கும் சமமாகப் பிரித்து அடுத்த மாத சீட்டுத் தொகையில் கழித்துக்கொள்ளப்படும்.',
    english: 'After 5% company commission, remaining discount is divided among all 20 members as dividend, lowering their next installment.'
  },
  {
    title: 'சேமிப்பாளர்களுக்கு அதிக லாபம் (Saver Benefit)',
    tamil: 'சீட்டை இறுதி வரை எடுக்காமல் வைத்திருக்கும் உறுப்பினர்கள் மிகக் குறைந்த தொகையே செலுத்தி (மொத்த தவணையில் ₹10,000+ வரை சேமிப்பு) முழுத் தொகையையும் பெறுவர்.',
    english: 'Subscribers who wait till later months pay much less total capital due to accumulated dividends, enjoying attractive annual returns.'
  },
  {
    title: 'ஏல தேதி & நேரம் (Auction Schedule)',
    tamil: 'பிரதி மாதம் 10 அல்லது 15-ம் தேதி மாலை 6.00 மணி முதல் 7.00 மணி வரை ஏலம் நடைபெறும். நேரில் அல்லது ஆப் வழியே கலந்து கொள்ளலாம்.',
    english: 'Auction takes place on the 10th or 15th of every month from 6:00 PM to 7:00 PM in person or digitally.'
  },
  {
    title: 'பணம் பெறுவதற்கான ஆவணங்கள் (Disbursal Terms)',
    tamil: 'ஏலம் எடுத்த உறுப்பினர் ஜாமீன்தாரர் (Co-applicant), காசோலை மற்றும் ஆவணங்களை சமர்ப்பித்து 7 முதல் 10 நாட்களுக்குள் தொகையைப் பெறலாம்.',
    english: 'Prize money disbursed within 7 to 10 days upon submitting guarantor documentation, cheques, and KYC.'
  }
];

export const AuctionPlanSchedule = () => {
  const [selectedPlan, setSelectedPlan] = useState<'all' | '100000' | '200000' | '500000' | '1000000'>('all');

  return (
    <div className="space-y-6">
      {/* Plan Category Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: '100000', name: '₹1,00,000', gross: 'Gross Due: ₹5,000', avgNet: 'Avg Net Due: ~₹4,450', totalSave: 'Save ~₹11,000', color: 'border-indigo-400 bg-indigo-50/70 text-indigo-950', badge: 'bg-indigo-700 text-white' },
          { id: '200000', name: '₹2,00,000', gross: 'Gross Due: ₹10,000', avgNet: 'Avg Net Due: ~₹8,900', totalSave: 'Save ~₹22,000', color: 'border-purple-400 bg-purple-50/70 text-purple-950', badge: 'bg-purple-700 text-white' },
          { id: '500000', name: '₹5,00,000', gross: 'Gross Due: ₹25,000', avgNet: 'Avg Net Due: ~₹22,250', totalSave: 'Save ~₹55,000', color: 'border-fuchsia-400 bg-fuchsia-50/70 text-fuchsia-950', badge: 'bg-fuchsia-700 text-white' },
          { id: '1000000', name: '₹10,00,000', gross: 'Gross Due: ₹50,000', avgNet: 'Avg Net Due: ~₹44,500', totalSave: 'Save ~₹1,10,000', color: 'border-amber-400 bg-amber-50/70 text-amber-950', badge: 'bg-amber-700 text-white' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlan(selectedPlan === p.id as any ? 'all' : p.id as any)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedPlan === p.id ? 'ring-2 ring-purple-600 shadow-md scale-[1.02]' : 'hover:shadow'
            } ${p.color}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.badge}`}>
                20 Months
              </span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                {p.totalSave}
              </span>
            </div>
            <h4 className="text-lg font-black">{p.name}</h4>
            <p className="text-xs font-semibold opacity-80 mt-1">{p.gross}</p>
            <p className="text-[11px] font-bold text-purple-900 mt-0.5">{p.avgNet}</p>
          </button>
        ))}
      </div>

      {/* How it Works Banner */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <h4 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-purple-600" />
          ஏலச் சீட்டு எவ்வாறு செயல்படுகிறது? (How Auction Chits Work in Tamil Nadu)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-600">
          <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 space-y-1">
            <span className="font-black text-purple-900 text-xs block">1. தலைகீழ் ஏலம் (Reverse Auction)</span>
            <p>தேவை உள்ளோர் தள்ளுபடி தொகையைக் கோருவர். அதிக தள்ளுபடி (30% வரை) கோரும் நபருக்கு சீட்டுப் பணம் உடனடியாக வழங்கப்படும்.</p>
          </div>
          <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 space-y-1">
            <span className="font-black text-indigo-900 text-xs block">2. மாதாந்திர டிவிடெண்ட் (Dividend Savings)</span>
            <p>ஏலத் தள்ளுபடியில் 5% கமிஷன் கழித்து, மீதித் தொகை அனைத்து 20 உறுப்பினர்களுக்கும் சமமாகப் பிரித்து அடுத்த தவணையில் கழிக்கப்படும்!</p>
          </div>
          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 space-y-1">
            <span className="font-black text-emerald-900 text-xs block">3. முதலீட்டாளர் லாபம் (High Return for Savers)</span>
            <p>முழு சீட்டு காலத்திலும் தவணைத் தொகையில் டிவிடெண்ட் கழிவதால், செலுத்த வேண்டிய மொத்தத் தொகை குறைந்து, சேமிப்பாளர் அதிக லாபம் பெறுவர்.</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-xl border border-neutral-200">
        <span className="text-xs font-bold text-neutral-500 px-3">Filter Column:</span>
        <button
          onClick={() => setSelectedPlan('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === 'all' ? 'bg-purple-950 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          All Plans
        </button>
        <button
          onClick={() => setSelectedPlan('100000')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === '100000' ? 'bg-indigo-700 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          ₹1,00,000 Scheme
        </button>
        <button
          onClick={() => setSelectedPlan('200000')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === '200000' ? 'bg-purple-700 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          ₹2,00,000 Scheme
        </button>
        <button
          onClick={() => setSelectedPlan('500000')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === '500000' ? 'bg-fuchsia-700 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          ₹5,00,000 Scheme
        </button>
        <button
          onClick={() => setSelectedPlan('1000000')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === '1000000' ? 'bg-amber-700 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          ₹10,00,000 Scheme
        </button>
      </div>

      {/* Auction Schedule Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-indigo-950 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-300" />
            <h3 className="font-bold text-base md:text-lg tracking-wide uppercase">
              Auction Schedule (Month 1 to 20 • Due vs Payout)
            </h3>
          </div>
          <span className="text-xs bg-indigo-900 text-purple-200 px-3 py-1 rounded-full font-semibold">
            20 Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-center text-xs md:text-sm font-sans">
            <thead>
              {/* Main Plan Headers */}
              <tr className="text-white font-black text-sm">
                <th rowSpan={2} className="bg-neutral-900 px-3 py-3 border-r border-neutral-800 w-16">
                  MONTH
                </th>
                <th rowSpan={2} className="bg-neutral-800 px-2 py-3 border-r border-neutral-700 w-16 text-[11px]">
                  BID %
                </th>
                {(selectedPlan === 'all' || selectedPlan === '100000') && (
                  <th colSpan={3} className="bg-indigo-800 px-4 py-2 border-r border-indigo-700">
                    1,00,000 CHIT
                  </th>
                )}
                {(selectedPlan === 'all' || selectedPlan === '200000') && (
                  <th colSpan={3} className="bg-purple-800 px-4 py-2 border-r border-purple-700">
                    2,00,000 CHIT
                  </th>
                )}
                {(selectedPlan === 'all' || selectedPlan === '500000') && (
                  <th colSpan={3} className="bg-fuchsia-800 px-4 py-2 border-r border-fuchsia-700">
                    5,00,000 CHIT
                  </th>
                )}
                {(selectedPlan === 'all' || selectedPlan === '1000000') && (
                  <th colSpan={3} className="bg-amber-700 px-4 py-2">
                    10,00,000 CHIT
                  </th>
                )}
              </tr>

              {/* Sub Headers */}
              <tr className="text-xs font-bold text-white uppercase tracking-wider">
                {(selectedPlan === 'all' || selectedPlan === '100000') && (
                  <>
                    <th className="bg-indigo-700 px-2.5 py-2 border-r border-indigo-600">NET DUE</th>
                    <th className="bg-indigo-600 px-2 py-2 border-r border-indigo-500 text-[10px]">DIVIDEND</th>
                    <th className="bg-indigo-900 px-2.5 py-2 border-r border-indigo-800 font-black">PRIZE</th>
                  </>
                )}
                {(selectedPlan === 'all' || selectedPlan === '200000') && (
                  <>
                    <th className="bg-purple-700 px-2.5 py-2 border-r border-purple-600">NET DUE</th>
                    <th className="bg-purple-600 px-2 py-2 border-r border-purple-500 text-[10px]">DIVIDEND</th>
                    <th className="bg-purple-900 px-2.5 py-2 border-r border-purple-800 font-black">PRIZE</th>
                  </>
                )}
                {(selectedPlan === 'all' || selectedPlan === '500000') && (
                  <>
                    <th className="bg-fuchsia-700 px-2.5 py-2 border-r border-fuchsia-600">NET DUE</th>
                    <th className="bg-fuchsia-600 px-2 py-2 border-r border-fuchsia-500 text-[10px]">DIVIDEND</th>
                    <th className="bg-fuchsia-900 px-2.5 py-2 border-r border-fuchsia-800 font-black">PRIZE</th>
                  </>
                )}
                {(selectedPlan === 'all' || selectedPlan === '1000000') && (
                  <>
                    <th className="bg-amber-600 px-2.5 py-2 border-r border-amber-500">NET DUE</th>
                    <th className="bg-amber-500 px-2 py-2 border-r border-amber-400 text-[10px] text-amber-950">DIVIDEND</th>
                    <th className="bg-amber-900 px-2.5 py-2 font-black">PRIZE</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 font-semibold">
              {auctionScheduleData.map((row) => (
                <tr key={row.month} className="hover:bg-purple-50/40 transition-colors">
                  {/* Month */}
                  <td className="bg-neutral-900 text-white font-bold py-2 px-3 border-r border-neutral-800">
                    {row.month}
                  </td>
                  <td className="bg-neutral-100 text-neutral-700 font-bold py-2 px-2 border-r border-neutral-200 text-xs">
                    {row.discountPct}%
                  </td>

                  {/* 1,00,000 Scheme */}
                  {(selectedPlan === 'all' || selectedPlan === '100000') && (
                    <>
                      <td className="py-2 px-2.5 bg-indigo-50/50 text-indigo-950 font-bold border-r border-neutral-100">
                        ₹{row.due1.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 bg-emerald-50/40 text-emerald-800 text-xs font-bold border-r border-neutral-100">
                        +₹{row.div1.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2.5 bg-indigo-50/20 text-indigo-900 font-black border-r border-neutral-200">
                        ₹{row.pay1.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}

                  {/* 2,00,000 Scheme */}
                  {(selectedPlan === 'all' || selectedPlan === '200000') && (
                    <>
                      <td className="py-2 px-2.5 bg-purple-50/50 text-purple-950 font-bold border-r border-neutral-100">
                        ₹{row.due2.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 bg-emerald-50/40 text-emerald-800 text-xs font-bold border-r border-neutral-100">
                        +₹{row.div2.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2.5 bg-purple-50/20 text-purple-900 font-black border-r border-neutral-200">
                        ₹{row.pay2.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}

                  {/* 5,00,000 Scheme */}
                  {(selectedPlan === 'all' || selectedPlan === '500000') && (
                    <>
                      <td className="py-2 px-2.5 bg-fuchsia-50/50 text-fuchsia-950 font-bold border-r border-neutral-100">
                        ₹{row.due5.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 bg-emerald-50/40 text-emerald-800 text-xs font-bold border-r border-neutral-100">
                        +₹{row.div5.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2.5 bg-fuchsia-50/20 text-fuchsia-900 font-black border-r border-neutral-200">
                        ₹{row.pay5.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}

                  {/* 10,00,000 Scheme */}
                  {(selectedPlan === 'all' || selectedPlan === '1000000') && (
                    <>
                      <td className="py-2 px-2.5 bg-amber-50/50 text-amber-950 font-bold border-r border-neutral-100">
                        ₹{row.due10.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 bg-emerald-50/40 text-emerald-800 text-xs font-bold border-r border-neutral-100">
                        +₹{row.div10.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2.5 bg-amber-50/20 text-amber-900 font-black">
                        ₹{row.pay10.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms & Conditions (ஏலச் சீட்டு விதிமுறைகள்) */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-900">
                ஏலச் சீட்டு விதிமுறைகள் (Auction Guidelines & Regulations)
              </h3>
              <p className="text-xs text-neutral-500">Tamil Nadu Chit Fund Act compliant rules for auction schemes</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            6 Guidelines
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {auctionRules.map((rule, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-purple-400 hover:shadow-sm transition-all flex gap-3.5"
            >
              <div className="w-7 h-7 rounded-full bg-purple-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                {index + 1}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-purple-950 uppercase tracking-wide">
                  {rule.title}
                </p>
                <p className="text-sm font-bold text-neutral-900 leading-snug">
                  {rule.tamil}
                </p>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  {rule.english}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Motto */}
        <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center text-center gap-3">
          <div className="text-base md:text-lg font-black text-purple-900">
            சிறிய சேமிப்பு! பெரிய வளர்ச்சி!!
          </div>
          <p className="text-xs text-neutral-400">
            Jenista Chits • Transparent Auctions • High Dividends • Complete Financial Security
          </p>
        </div>
      </div>
    </div>
  );
};
