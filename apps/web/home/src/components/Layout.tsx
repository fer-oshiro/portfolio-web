import { Outlet } from 'react-router'
import { Transition } from './Transition'

export const Layout = () => {
  return (
    <>
      <Transition />
      <Outlet />
    </>
  )
}
