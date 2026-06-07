// import React from 'react'
import { type Bill } from '../../api/bills'



export default function Bills() {
  const bills: Bill[] = [] // wired to API once BillsController is built

  return (
    <main className="max-w-5xl mx-auto px-3 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bills</h1>
        <button className="text-sm text-blue-500 hover:text-blue-400 cursor-pointer">
          + Add Bill
        </button>
      </div>

      {/* --- PLANNED FEATURES ---
          CRUD:
          - Add bill (name, amount, frequency, due day, category, auto-pay)
          - Edit bill
          - Delete bill (soft delete)
          - Mark as paid (updates LastPaidDate)

          Display:
          - Due date countdown ("due in 3 days", "overdue by 2 days")
          - Overdue highlighting (red) when past due and LastPaidDate doesn't cover current period
          - Monthly fixed expense total at top
          - Upcoming 30-day view sorted by due date
          - Auto-pay badge + filter to separate manual vs automatic bills

          Future:
          - Due date notifications/reminders
          - Payment history log
          - 
      */}

      {/* Upcoming bills */}
      <section className="border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-medium">Upcoming</h2>
        </div>
        {bills.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-600 text-sm">
            No bills added yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-900">
            {bills.map(b => (
              <div key={b.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-900/40 transition-colors cursor-pointer">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-200 font-medium">{b.name}</span>
                    {b.isAutoPay && (
                      <span className="text-xs text-blue-400 border border-blue-800 rounded px-1.5 py-0.5">Auto-pay</span>
                    )}
                  </div>
                  {b.category && <p className="text-xs text-gray-500">{b.category}</p>}
                  <p className="text-xs text-gray-500">{b.frequency}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-300 font-medium">${b.amount.toFixed(2)}</span>
                  <button className="text-red-500 hover:text-red-400 transition-colors text-sm">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
