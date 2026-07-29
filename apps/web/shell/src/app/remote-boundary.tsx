import { Component, Suspense, type ReactNode } from 'react'

interface RemoteBoundaryProps {
  children: ReactNode
  name: string
}

interface RemoteErrorBoundaryState {
  hasError: boolean
}

class RemoteErrorBoundary extends Component<
  RemoteBoundaryProps,
  RemoteErrorBoundaryState
> {
  state: RemoteErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): RemoteErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section role="alert">
          <p>Não foi possível carregar {this.props.name}.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
          <nav aria-label="Outras páginas">
            <a href="/">Home</a>
            <a href="/blog">Blog</a>
            <a href="/resume">Resume</a>
          </nav>
        </section>
      )
    }

    return this.props.children
  }
}

export function RemoteBoundary({ children, name }: RemoteBoundaryProps) {
  return (
    <RemoteErrorBoundary name={name}>
      <Suspense fallback={<p>Carregando {name}...</p>}>{children}</Suspense>
    </RemoteErrorBoundary>
  )
}
