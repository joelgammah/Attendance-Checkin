import React from 'react'
import { getUserRoles, getActiveRole, setActiveRole, Role } from '../api/auth'

export default function RoleSwitch() {
  const roles = getUserRoles()
  const active = getActiveRole()

  if (!roles.length || !active) return null

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value as Role
    setActiveRole(nextRole)
    window.location.reload() // Simple reload to apply new role
  }

  if (roles.length === 1) {
    // Single role - show badge with nav styling
    return (
      <div className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="capitalize">{active}</span>
        </div>
      </div>
    )
  }

  // Multiple roles - show dropdown with nav styling
  return (
    <div className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 transition-colors duration-200"
         onMouseEnter={(e) => {
           e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.1)';
           e.currentTarget.style.color = '#95866A';
         }}
         onMouseLeave={(e) => {
           e.currentTarget.style.backgroundColor = 'transparent';
           e.currentTarget.style.color = '#374151';
         }}>
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>
        <select
          value={active}
          onChange={onChange}
          aria-label="Switch User Role"
          className="bg-transparent border-none outline-none text-inherit font-medium cursor-pointer"
        >
          {roles.map(r => (
            <option key={r} value={r} className="text-gray-900 bg-white">{r}</option>
          ))}
        </select>
        </span>
      </div>
    </div>
  )
}