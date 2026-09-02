import { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { TopBar } from './components/TopBar'
import { ProblemListView } from './components/problems/ProblemListView'
import { WorkspaceView } from './components/workspace/WorkspaceView'
import { SettingsModal } from './components/SettingsModal'

export default function App() {
  const view = useAppStore((s) => s.view)
  const currentProblemId = useAppStore((s) => s.currentProblemId)
  const theme = useAppStore((s) => s.theme)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      {view === 'workspace' && currentProblemId ? (
        <WorkspaceView problemId={currentProblemId} />
      ) : (
        <ProblemListView />
      )}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
