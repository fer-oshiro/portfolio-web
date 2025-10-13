import { Link } from 'react-router'

export const MainPage = () => {
  return (
    <div>
      <div>Main Page of the Blog App</div>
      <Link to="first-post">Go to First Post</Link>
    </div>
  )
}
