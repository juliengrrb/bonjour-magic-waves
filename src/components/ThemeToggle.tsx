import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 hover:bg-accent/50 transition-colors"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-warning animate-float-bounce" />
      ) : (
        <Moon className="h-4 w-4 text-primary" />
      )}
      <span className="sr-only">Changer de thème</span>
    </Button>
  )
}