'use client';

import { Sidebar } from '@/components/sidebar/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { NoteEditor } from '@/components/editor/NoteEditor';
import { GraphView } from '@/components/graph/GraphView';
import { useNoteStore } from '@/stores/noteStore';
import { useNotes } from '@/hooks/useNotes';

export default function Home() {
  const { viewMode } = useNoteStore();
  useNotes();

  const renderMainContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return <Dashboard />;
      case 'graph':
        return <GraphView />;
      case 'note':
        return <NoteEditor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{renderMainContent()}</main>
    </div>
  );
}
