import { Outlet, Link } from 'react-router-dom'
import { ModeToggle } from './mode-toggle'
import { Barcode, Settings } from 'lucide-react'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <Barcode className="h-6 w-6" />
            <span className="hidden sm:inline-block">Label Creator</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              to="/settings" 
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <Outlet />
      </main>
      <footer className="border-t py-4">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Label Creator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
} 