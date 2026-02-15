import TradingDashboard from './TradingDashboard';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div dir="rtl" className="min-h-screen bg-bg text-text font-sans transition-colors duration-300">
      <TradingDashboard theme={theme} onToggleTheme={toggleTheme} />
    </div>
  );
}
