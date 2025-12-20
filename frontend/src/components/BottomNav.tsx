import { Sliders, Map, ListOrdered, FileText, Download } from 'lucide-react';

type BottomNavProps = {
  currentScreen: string;
  onNavigate: (screen: 'priorities' | 'map' | 'streets' | 'deepdive' | 'export') => void;
};

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'priorities', icon: Sliders, label: 'Priorities' },
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'streets', icon: ListOrdered, label: 'Streets' },
    { id: 'export', icon: Download, label: 'Export' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-bottom">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors relative ${
                  isActive ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}