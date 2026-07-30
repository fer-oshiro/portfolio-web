import { Outlet } from 'react-router'
import { Transition } from '../features/scene-navigation'

export const Layout = () => {
  return (
    <>
      <Transition />
      <Outlet />
    </>
  )
}
