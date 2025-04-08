import React from 'react'
import { css } from 'styled-system/css'

export function ColorsGrid() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className={css({ bg: 'rose.100', color: 'rose.100' })} />
      <div className={css({ bg: 'rose.200', color: 'rose.200' })} />
      <div className={css({ bg: 'rose.300', color: 'rose.300' })} />
      <div className={css({ bg: 'rose.400', color: 'rose.400' })} />
      <div className={css({ bg: 'rose.500', color: 'rose.500' })} />

      <div className={css({ bg: 'bg', color: 'bg' })} />

      <div className={css({ bg: 'magic.glow', color: 'magic.glow' })} />
      <div className={css({ bg: 'magic.light', color: 'magic.light' })} />

      <div className={css({ bg: 'staff.bronze', color: 'staff.bronze' })} />
      <div className={css({ bg: 'staff.gem', color: 'staff.gem' })} />
      <div className={css({ bg: 'staff.gold', color: 'staff.gold' })} />
      <div className={css({ bg: 'staff.ruby', color: 'staff.ruby' })} />
      <div className={css({ bg: 'staff.wood', color: 'staff.wood' })} />
    </div>
  )
}
