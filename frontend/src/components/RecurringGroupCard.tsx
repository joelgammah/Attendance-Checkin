// src/components/RecurringGroupCard.tsx

import { Link } from './Protected'
import type { RecurringGroup } from '../types'

export default function RecurringGroupCard({ group }: { group: RecurringGroup }) {
  const next = group.next_session
  const parent = group.parent

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">

          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            {parent.name}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#059669' }}
            >
              Recurring
            </span>
          </h3>

          {/* Next session */}
          <div className="space-y-2 text-sm text-gray-600">
            {next ? (
              <div className="flex items-center space-x-2">
                <span>Next session: {new Date(next.start_time).toLocaleString()}</span>
              </div>
            ) : (
              <p className="text-gray-500">No upcoming sessions</p>
            )}

            <p className="text-gray-700">
              {group.total_past_sessions} past • {group.upcoming_sessions.length} upcoming
            </p>
          </div>

        </div>

        {/* Button */}
        <Link
          to={`/events/${parent.id}/family`}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900"
        >
          View Series
        </Link>
      </div>
    </div>
  )
}
