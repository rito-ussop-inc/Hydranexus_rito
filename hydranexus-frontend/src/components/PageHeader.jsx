import { Menu, Play, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export default function PageHeader({ title, subtitle, onMenu, onTrigger, incidentActive }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button variant="ghost" size="icon" onClick={onMenu} className="lg:hidden" aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {incidentActive ? (
            <Badge variant="destructive">Incident active</Badge>
          ) : (
            <Badge variant="secondary">All systems normal</Badge>
          )}
          <Button size="sm" variant={incidentActive ? 'outline' : 'default'} onClick={onTrigger}>
            {incidentActive ? (
              <>
                <RotateCcw /> Resolve demo
              </>
            ) : (
              <>
                <Play /> Trigger demo
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
