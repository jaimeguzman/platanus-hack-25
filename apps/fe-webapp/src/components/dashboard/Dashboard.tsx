'use client';

import { useNoteStore } from '@/stores/noteStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Clock, Tag, Star } from 'lucide-react';
import { useMemo } from 'react';
import { APP_CONFIG, UI_MESSAGES, FORMATTING } from '@/constants';

export function Dashboard() {
  const { getFilteredNotes, notes, setCurrentNote, setViewMode, toggleNoteFavorite } = useNoteStore();

  const filteredNotes = getFilteredNotes();

  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const filteredNotesCount = filteredNotes.length;
    const totalTags = new Set(notes.flatMap((n) => n.tags)).size;
    
    // Get top categories by note count
    const categoryCount = notes.reduce((acc, note) => {
      const category = note.pillar || 'Sin categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    // Recent notes from filtered results
    const recentNotes = filteredNotes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, APP_CONFIG.DASHBOARD_RECENT_NOTES_LIMIT);

    return {
      totalNotes,
      filteredNotesCount,
      totalTags,
      topCategories,
      recentNotes,
    };
  }, [notes, filteredNotes]);

  const handleNoteClick = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setCurrentNote(note);
      setViewMode('note');
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Vista general de tu conocimiento personal
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.filteredNotesCount} visibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTags}</div>
              <p className="text-xs text-muted-foreground">
                Etiquetas únicas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stats.topCategories[0]?.[0] || 'Principal'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.topCategories[0]?.[1] || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Categoría principal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentNotes.length}</div>
              <p className="text-xs text-muted-foreground">
                Últimas 5 notas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Recientes</CardTitle>
            <CardDescription>
              Tus últimas notas actualizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {UI_MESSAGES.NO_NOTES}
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleNoteClick(note.id)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{note.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.updatedAt).toLocaleDateString(FORMATTING.DATE_LOCALE, FORMATTING.DATE_OPTIONS_DAY_MONTH)}
                        </span>
                        {note.tags.length > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <div className="flex gap-1">
                              {note.tags.slice(0, APP_CONFIG.MAX_TAGS_DISPLAY).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-secondary px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {note.tags.length > APP_CONFIG.MAX_TAGS_DISPLAY && (
                                <span className="text-xs text-muted-foreground">
                                  +{note.tags.length - APP_CONFIG.MAX_TAGS_DISPLAY}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNoteFavorite(note.id);
                        }}
                        title={note.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            note.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''
                          }`}
                        />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Categories */}
        {stats.topCategories.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {stats.topCategories.map(([category, count], index) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {index === 0 ? 'Categoría principal' : 
                     index === 1 ? 'Segunda categoría' : 
                     'Tercera categoría'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

