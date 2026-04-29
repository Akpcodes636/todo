import { Toaster } from 'sonner'
import { TodoDashboardPage } from './pages/TodoDashboardPage'

function App() {
  return (
    <>
      <TodoDashboardPage />
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
