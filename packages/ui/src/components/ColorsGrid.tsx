import React from 'react'

export function ColorsGrid() {
  return (
    <div className="flex flex-col gap-8">
      <div className="bg-rose-100 text-rose-100" />
      <div className="bg-rose-200 text-rose-200" />
      <div className="bg-rose-300 text-rose-300" />
      <div className="bg-rose-400 text-rose-400" />
      <div className="bg-rose-500 text-rose-500" />

      <div className="bg-background text-background" />

      <div className="bg-magic-glow text-magic-glow" />
      <div className="bg-magic-light text-magic-light" />

      <div className="bg-staff-bronze text-staff-bronze" />
      <div className="bg-staff-gem text-staff-gem" />
      <div className="bg-staff-gold text-staff-gold" />
      <div className="bg-staff-ruby text-staff-ruby" />
      <div className="bg-staff-wood text-staff-wood" />
    </div>
  )
}
