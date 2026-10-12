import { useState } from 'react';
import { Calendar, Eye, ShieldCheck, Award, Sparkles } from 'lucide-react';

interface MonthSchedule {
  month: number;
  due1: number;
  pay1: number;
  due2: number;
  pay2: number;
  due5: number;
  pay5: number;
  due10: number;
  pay10: number;
}

const scheduleData: MonthSchedule[] = [
  { month: 1, due1: 5000, pay1: 95000, due2: 10000, pay2: 190000, due5: 25000, pay5: 475000, due10: 50000, pay10: 950000 },
  { month: 2, due1: 5000, pay1: 96000, due2: 10000, pay2: 192000, due5: 25000, pay5: 480000, due10: 50000, pay10: 960000 },
  { month: 3, due1: 5000, pay1: 97000, due2: 10000, pay2: 194000, due5: 25000, pay5: 485000, due10: 50000, pay10: 970000 },
  { month: 4, due1: 5000, pay1: 98000, due2: 10000, pay2: 196000, due5: 25000, pay5: 490000, due10: 50000, pay10: 980000 },
  { month: 5, due1: 5000, pay1: 99000, due2: 10000, pay2: 198000, due5: 25000, pay5: 495000, due10: 50000, pay10: 990000 },
  { month: 6, due1: 5000, pay1: 100000, due2: 10000, pay2: 200000, due5: 25000, pay5: 500000, due10: 50000, pay10: 1000000 },
  { month: 7, due1: 5000, pay1: 101000, due2: 10000, pay2: 202000, due5: 25000, pay5: 505000, due10: 50000, pay10: 1010000 },
  { month: 8, due1: 5000, pay1: 102000, due2: 10000, pay2: 204000, due5: 25000, pay5: 510000, due10: 50000, pay10: 1020000 },
  { month: 9, due1: 5000, pay1: 103000, due2: 10000, pay2: 206000, due5: 25000, pay5: 515000, due10: 50000, pay10: 1030000 },
  { month: 10, due1: 5000, pay1: 104000, due2: 10000, pay2: 208000, due5: 25000, pay5: 520000, due10: 50000, pay10: 1040000 },
  { month: 11, due1: 5000, pay1: 105000, due2: 10000, pay2: 210000, due5: 25000, pay5: 525000, due10: 50000, pay10: 1050000 },
  { month: 12, due1: 5000, pay1: 106000, due2: 10000, pay2: 212000, due5: 25000, pay5: 530000, due10: 50000, pay10: 1060000 },
  { month: 13, due1: 5000, pay1: 107000, due2: 10000, pay2: 214000, due5: 25000, pay5: 535000, due10: 50000, pay10: 1070000 },
  { month: 14, due1: 5000, pay1: 108000, due2: 10000, pay2: 216000, due5: 25000, pay5: 540000, due10: 50000, pay10: 1080000 },
  { month: 15, due1: 5000, pay1: 109000, due2: 10000, pay2: 218000, due5: 25000, pay5: 545000, due10: 50000, pay10: 1090000 },
  { month: 16, due1: 5000, pay1: 110000, due2: 10000, pay2: 220000, due5: 25000, pay5: 550000, due10: 50000, pay10: 1100000 },
  { month: 17, due1: 5000, pay1: 111000, due2: 10000, pay2: 222000, due5: 25000, pay5: 555000, due10: 50000, pay10: 1110000 },
  { month: 18, due1: 5000, pay1: 112000, due2: 10000, pay2: 224000, due5: 25000, pay5: 560000, due10: 50000, pay10: 1120000 },
  { month: 19, due1: 5000, pay1: 113000, due2: 10000, pay2: 226000, due5: 25000, pay5: 565000, due10: 50000, pay10: 1130000 },
  { month: 20, due1: 5000, pay1: 114000, due2: 10000, pay2: 228000, due5: 25000, pay5: 570000, due10: 50000, pay10: 1140000 },
];

const rules = [
  {
    tamil: 'பிரதி மாதம் 10/15 ம் தேதி மாலை 6.00 மணி முதல் 7.00 மணி வரை ஏலம் விடப்படும்.',
    english: 'Auction/Draw takes place every month on 10th or 15th between 6:00 PM and 7:00 PM.',
  },
  {
    tamil: 'ஏலம் நடைபெற்று முடிந்து 3 நாட்களுக்குள் சீட்டுத்தொகையை கண்டிப்பாக செலுத்த வேண்டும்.',
    english: 'Chit installments must be paid strictly within 3 days after auction completion.',
  },
  {
    tamil: 'தொடர்ந்து 3 மாதங்கள் சீட்டு கட்டத் தவறினால் சீட்டிலிருந்து நீக்கப்படுவர், சீட்டு முடிந்தவுடன் கட்டிய பணம் வழங்கப்படும்.',
    english: 'Failure to pay for 3 consecutive months will lead to removal; paid amount will be refunded upon chit completion.',
  },
  {
    tamil: 'சீட்டு எடுத்தவருக்கு ஜாமீன்தாரரும் Co-Applicant-ம் முழுப் பொறுப்பு.',
    english: 'The guarantor and Co-Applicant bear full responsibility for the prize chit winner.',
  },
  {
    tamil: 'குலுக்கல் சீட்டு வாடிக்கையாளர்கள் குலுக்கல் நேரத்திற்கு முன்பாக சீட்டு தொகையை கண்டிப்பாக செலுத்த வேண்டும்.',
    english: 'Lucky draw members must clear their due amount strictly prior to the draw time.',
  },
  {
    tamil: 'சீட்டு எடுத்த நபர் ஜாமீன்தாரருடன் சேர்ந்து Co.Applicant உடன் வந்து, முத்திரைத்தாள் (பத்திரம்), அடையாள அட்டை நகல், வங்கி காசோலை (Cheque) இவைகளை சமர்ப்பித்து சீட்டு முடிந்து 10 நாட்களுக்குள் பணம் பெற்றுக் கொள்ளலாம்.',
    english: 'Prize winners must present Guarantor and Co-Applicant with Stamp Paper, ID Proofs, and Bank Cheque to receive funds within 10 days.',
  },
  {
    tamil: 'சீட்டு வேண்டுபவர்களை மட்டுமே குலுக்கலில் சேர்த்துக்கொள்ளப்படும்.',
    english: 'Only customers requesting the chit will be included in the draw.',
  },
];

const postDrawRules = [
  { plan: '₹1,00,000 Chit', base: '₹5,000', add: '₹1,000', total: '₹6,000' },
  { plan: '₹2,00,000 Chit', base: '₹10,000', add: '₹2,000', total: '₹12,000' },
  { plan: '₹5,00,000 Chit', base: '₹25,000', add: '₹5,000', total: '₹30,000' },
  { plan: '₹10,00,000 Chit', base: '₹50,000', add: '₹10,000', total: '₹60,000' },
];

export const FixedPlanSchedule = () => {
  const [selectedPlan, setSelectedPlan] = useState<'all' | '100000' | '200000' | '500000' | '1000000'>('all');
  const [showPosterModal, setShowPosterModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-primary-900 text-white rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Official Schedule
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              JENISTA CHITS SCHEDULE
            </h2>
            <p className="text-emerald-100 text-sm md:text-base mt-1 font-medium">
              20 Months • 20 Members Fixed Plan Chart (ரூ. 1L to ரூ. 10L)
            </p>
          </div>
          <button
            onClick={() => setShowPosterModal(true)}
            className="flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 hover:scale-[1.02]"
          >
            <Eye className="w-4 h-4 text-emerald-700" />
            View Official Chart Image
          </button>
        </div>
      </div>

      {/* Plan Category Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: '100000', name: '₹1,00,000', due: '₹5,000/mo', color: 'border-orange-500 bg-orange-50 text-orange-950', badge: 'bg-orange-500 text-white' },
          { id: '200000', name: '₹2,00,000', due: '₹10,000/mo', color: 'border-purple-500 bg-purple-50 text-purple-950', badge: 'bg-purple-600 text-white' },
          { id: '500000', name: '₹5,00,000', due: '₹25,000/mo', color: 'border-sky-500 bg-sky-50 text-sky-950', badge: 'bg-sky-600 text-white' },
          { id: '1000000', name: '₹10,00,000', due: '₹50,000/mo', color: 'border-amber-500 bg-amber-50 text-amber-950', badge: 'bg-amber-600 text-white' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlan(selectedPlan === p.id as any ? 'all' : p.id as any)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedPlan === p.id ? 'ring-2 ring-primary-600 shadow-md scale-[1.02]' : 'hover:shadow'
            } ${p.color}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.badge}`}>
                20 Months
              </span>
              {selectedPlan === p.id && <span className="text-xs font-bold text-primary-700">Selected</span>}
            </div>
            <h4 className="text-lg font-black">{p.name}</h4>
            <p className="text-xs font-semibold opacity-80 mt-1">Due: {p.due}</p>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-xl border border-neutral-200">
        <span className="text-xs font-bold text-neutral-500 px-3">Filter Column:</span>
        <button
          onClick={() => setSelectedPlan('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === 'all' ? 'bg-primary-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          All Plans
        </button>
        <button
          onClick={() => setSelectedPlan('100000')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === '100000' ? 'bg-orange-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          ₹1,00,000
        </button>
        <button
          onClick={() => setSelectedPlan('200000')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === '200000' ? 'bg-purple-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          ₹2,00,000
        </button>
        <button
          onClick={() => setSelectedPlan('500000')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === '500000' ? 'bg-sky-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          ₹5,00,000
        </button>
        <button
          onClick={() => setSelectedPlan('1000000')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            selectedPlan === '1000000' ? 'bg-amber-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          ₹10,00,000
        </button>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-emerald-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base md:text-lg tracking-wide uppercase">
              Schedule Table (Month 1 to 20)
            </h3>
          </div>
          <span className="text-xs bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full font-semibold">
            20 Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-center text-xs md:text-sm font-sans">
            <thead>
              {/* Main Plan Headers */}
              <tr className="text-white font-black text-sm">
                <th rowSpan={2} className="bg-red-800 px-3 py-3 border-r border-red-700 w-16">
                  MONTH
                </th>
                {(selectedPlan === 'all' || selectedPlan === '100000') && (
                  <th colSpan={2} className="bg-orange-600 px-4 py-2 border-r border-orange-500">
                    1,00,000
                  </th>
                )}
                {(selectedPlan === 'all' || selectedPlan === '200000') && (
                  <th colSpan={2} className="bg-purple-700 px-4 py-2 border-r border-purple-600">
                    2,00,000
                  </th>
                )}
                {(selectedPlan === 'all' || selectedPlan === '500000') && (
                  <th colSpan={2} className="bg-sky-600 px-4 py-2 border-r border-sky-500">
                    5,00,000
                  </th>
                )}
                {(selectedPlan === 'all' || selectedPlan === '1000000') && (
                  <th colSpan={2} className="bg-amber-500 px-4 py-2">
                    10,00,000
                  </th>
                )}
              </tr>

              {/* Sub Headers (Due vs Payment) */}
              <tr className="text-xs font-bold text-white uppercase tracking-wider">
                {(selectedPlan === 'all' || selectedPlan === '100000') && (
                  <>
                    <th className="bg-orange-500/95 px-3 py-2 border-r border-orange-400">DUE</th>
                    <th className="bg-orange-500/80 px-3 py-2 border-r border-orange-400">PAYMENT</th>
                  </>
                )}
                {(selectedPlan === 'all' || selectedPlan === '200000') && (
                  <>
                    <th className="bg-purple-600/95 px-3 py-2 border-r border-purple-500">DUE</th>
                    <th className="bg-purple-600/80 px-3 py-2 border-r border-purple-500">PAYMENT</th>
                  </>
                )}
                {(selectedPlan === 'all' || selectedPlan === '500000') && (
                  <>
                    <th className="bg-sky-500/95 px-3 py-2 border-r border-sky-400">DUE</th>
                    <th className="bg-sky-500/80 px-3 py-2 border-r border-sky-400">PAYMENT</th>
                  </>
                )}
                {(selectedPlan === 'all' || selectedPlan === '1000000') && (
                  <>
                    <th className="bg-amber-400/95 text-amber-950 px-3 py-2 border-r border-amber-300">DUE</th>
                    <th className="bg-amber-400/80 text-amber-950 px-3 py-2">PAYMENT</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 font-semibold">
              {scheduleData.map((row) => (
                <tr key={row.month} className="hover:bg-neutral-50/80 transition-colors">
                  {/* Month Index */}
                  <td className="bg-red-800 text-white font-bold py-2.5 px-3 border-r border-red-700">
                    {row.month}
                  </td>

                  {/* 1,00,000 Plan */}
                  {(selectedPlan === 'all' || selectedPlan === '100000') && (
                    <>
                      <td className="py-2.5 px-3 bg-orange-50/50 text-orange-950 border-r border-neutral-100">
                        {row.due1.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 bg-orange-50/20 text-orange-900 font-bold border-r border-neutral-200">
                        {row.pay1.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}

                  {/* 2,00,000 Plan */}
                  {(selectedPlan === 'all' || selectedPlan === '200000') && (
                    <>
                      <td className="py-2.5 px-3 bg-purple-50/50 text-purple-950 border-r border-neutral-100">
                        {row.due2.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 bg-purple-50/20 text-purple-900 font-bold border-r border-neutral-200">
                        {row.pay2.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}

                  {/* 5,00,000 Plan */}
                  {(selectedPlan === 'all' || selectedPlan === '500000') && (
                    <>
                      <td className="py-2.5 px-3 bg-sky-50/50 text-sky-950 border-r border-neutral-100">
                        {row.due5.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 bg-sky-50/20 text-sky-900 font-bold border-r border-neutral-200">
                        {row.pay5.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}

                  {/* 10,00,000 Plan */}
                  {(selectedPlan === 'all' || selectedPlan === '1000000') && (
                    <>
                      <td className="py-2.5 px-3 bg-amber-50/50 text-amber-950 border-r border-neutral-100">
                        {row.due10.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 bg-amber-50/20 text-amber-900 font-bold">
                        {row.pay10.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post-Draw Installment Calculation Card */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-amber-700" />
          <h4 className="font-extrabold text-amber-950 text-base">
            சீட்டு எடுத்த நபர் அடுத்த மாதத்திலிருந்து கட்ட வேண்டிய தொகை (Post-Draw Due Structure)
          </h4>
        </div>
        <p className="text-xs text-amber-800 mb-4 font-medium">
          Once you win/receive the prize money, your revised monthly installments for the remaining months:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {postDrawRules.map((rule, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase">{rule.plan}</span>
              <div className="mt-2 text-sm text-neutral-600 font-medium">
                {rule.base} + <span className="text-amber-700 font-bold">{rule.add}</span>
              </div>
              <div className="mt-1 text-base font-black text-amber-950">
                = {rule.total} / month
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terms & Conditions (நிபந்தனைகள்) */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-900">
                நிபந்தனைகள் (Rules & Regulations)
              </h3>
              <p className="text-xs text-neutral-500">Official terms governing Jenista Chits participation</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold">
            7 Guidelines
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-primary-400 hover:shadow-sm transition-all flex gap-3.5"
            >
              <div className="w-7 h-7 rounded-full bg-primary-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                {index + 1}
              </div>
              <div className="space-y-1">
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
          <div className="text-base md:text-lg font-black text-emerald-800">
            சேமிப்போம்! நல் வாழ்வு பெறுவோம்!!
          </div>
          <p className="text-xs text-neutral-400">
            Jenista Chits • Transparent, Trusted & Rewarding Chit Schemes
          </p>
        </div>
      </div>

      {/* Official Poster Modal */}
      {showPosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h3 className="font-bold text-neutral-900 text-base">
                Official Fixed Plan Chart Poster
              </h3>
              <button
                onClick={() => setShowPosterModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center text-neutral-700 font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex justify-center bg-neutral-900">
              <img
                src="/assets/fixed-plan-schedule.jpg"
                alt="Jenista Chits Fixed Plan Schedule"
                className="max-w-full h-auto rounded-lg shadow-lg object-contain"
              />
            </div>
            <div className="p-3 bg-neutral-100 flex justify-end gap-3">
              <a
                href="/assets/fixed-plan-schedule.jpg"
                download="jenista-chits-schedule.jpg"
                className="px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Download Poster
              </a>
              <button
                onClick={() => setShowPosterModal(false)}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
