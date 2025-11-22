import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { MOCK_PROJECTS, MOCK_NOTES } from '../src/constants/mockData';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MigrationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

async function migrateUser(): Promise<MigrationResult> {
  console.log('📝 Migrando usuario de prueba...');

  const userId = '00000000-0000-0000-0000-000000000001';
  const userEmail = 'demo@secondbrain.com';

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (existingUser) {
    console.log('ℹ️  Usuario ya existe, saltando...');
    return {
      success: true,
      message: 'Usuario ya existe',
      data: { id: userId },
    };
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: userEmail,
      name: 'Usuario Demo',
      plan: 'free',
      notes_limit: 100,
      storage_limit: 1073741824,
      notes_count_current_month: 0,
      storage_used: 0,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: 'Error creando usuario', error };
  }

  return { success: true, message: 'Usuario creado exitosamente', data };
}

async function migrateProjects(userId: string): Promise<MigrationResult> {
  console.log('📁 Migrando proyectos...');

  const projectIdMap: Record<string, string> = {
    'default': '00000000-0000-0000-0000-000000000010',
    'work': '00000000-0000-0000-0000-000000000011',
    'ideas': '00000000-0000-0000-0000-000000000012',
    'learning': '00000000-0000-0000-0000-000000000013',
  };

  const projectsToInsert = MOCK_PROJECTS.map((project) => ({
    id: projectIdMap[project.id] || project.id,
    user_id: userId,
    name: project.name,
    color: project.color,
  }));

  const { data: existingProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  const existingIds = new Set(existingProjects?.map((p) => p.id) || []);
  const newProjects = projectsToInsert.filter((p) => !existingIds.has(p.id));

  if (newProjects.length === 0) {
    console.log('ℹ️  Todos los proyectos ya existen, saltando...');
    return { success: true, message: 'Proyectos ya existen' };
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(newProjects)
    .select();

  if (error) {
    return { success: false, message: 'Error creando proyectos', error };
  }

  return {
    success: true,
    message: `${data?.length || 0} proyectos creados exitosamente`,
    data,
  };
}

async function migrateNotes(userId: string): Promise<MigrationResult> {
  console.log('📝 Migrando notas...');

  const noteIdMap: Record<string, string> = {
    'note-1': '00000000-0000-0000-0000-000000000020',
    'note-2': '00000000-0000-0000-0000-000000000021',
    'note-3': '00000000-0000-0000-0000-000000000022',
    'note-4': '00000000-0000-0000-0000-000000000023',
    'note-5': '00000000-0000-0000-0000-000000000024',
  };

  const projectIdMap: Record<string, string> = {
    'default': '00000000-0000-0000-0000-000000000010',
    'work': '00000000-0000-0000-0000-000000000011',
    'ideas': '00000000-0000-0000-0000-000000000012',
    'learning': '00000000-0000-0000-0000-000000000013',
  };

  const results = {
    notesCreated: 0,
    tagsCreated: 0,
    errors: [] as any[],
  };

  for (const note of MOCK_NOTES) {
    try {
      const { data: existingNote } = await supabase
        .from('notes')
        .select('id')
        .eq('id', note.id)
        .single();

      if (existingNote) {
        console.log(`ℹ️  Nota "${note.title}" ya existe, saltando...`);
        continue;
      }

      const mappedProjectId = note.projectId ? (projectIdMap[note.projectId] || null) : null;

      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          id: noteIdMap[note.id] || note.id,
          user_id: userId,
          project_id: mappedProjectId,
          title: note.title,
          content: note.content,
          is_pinned: note.isPinned || false,
        })
        .select()
        .single();

      if (noteError) {
        results.errors.push({
          note: note.title,
          error: noteError.message,
        });
        console.error(`❌ Error creando nota "${note.title}":`, noteError.message);
        continue;
      }

      results.notesCreated++;
      console.log(`✅ Nota creada: "${note.title}"`);

      if (note.tags && note.tags.length > 0) {
        for (const tagName of note.tags) {
          let tagId: string;

          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('user_id', userId)
            .eq('name', tagName)
            .single();

          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert({
                user_id: userId,
                name: tagName,
                color: null,
              })
              .select('id')
              .single();

            if (tagError) {
              console.error(`❌ Error creando tag "${tagName}":`, tagError.message);
              continue;
            }

            tagId = newTag.id;
            results.tagsCreated++;
            console.log(`  ✅ Tag creado: "${tagName}"`);
          }

          const { error: noteTagError } = await supabase
            .from('note_tags')
            .insert({
              note_id: noteData.id,
              tag_id: tagId,
            });

          if (noteTagError && !noteTagError.message.includes('duplicate')) {
            console.error(
              `❌ Error asociando tag "${tagName}" con nota "${note.title}":`,
              noteTagError.message
            );
          }
        }
      }
    } catch (err) {
      results.errors.push({
        note: note.title,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      console.error(`❌ Error inesperado con nota "${note.title}":`, err);
    }
  }

  return {
    success: results.errors.length === 0,
    message: `${results.notesCreated} notas y ${results.tagsCreated} tags creados`,
    data: results,
  };
}

async function runMigration() {
  console.log('🚀 Iniciando migración de datos mock a Supabase...\n');

  try {
    const userResult = await migrateUser();
    if (!userResult.success) {
      console.error('❌ Migración fallida:', userResult.error);
      process.exit(1);
    }

    const userId = userResult.data?.id || '00000000-0000-0000-0000-000000000001';

    const projectsResult = await migrateProjects(userId);
    if (!projectsResult.success) {
      console.error('❌ Error migrando proyectos:', projectsResult.error);
    } else {
      console.log(`✅ ${projectsResult.message}\n`);
    }

    const notesResult = await migrateNotes(userId);
    if (!notesResult.success) {
      console.warn('⚠️  Migración de notas completada con errores');
      console.log('Errores:', notesResult.data?.errors);
    } else {
      console.log(`✅ ${notesResult.message}\n`);
    }

    console.log('\n🎉 Migración completada!');
    console.log('\n📊 Resumen:');
    console.log(`   Usuario: ${userResult.message}`);
    console.log(`   Proyectos: ${projectsResult.message}`);
    console.log(`   Notas: ${notesResult.message}`);

    if (notesResult.data?.errors && notesResult.data.errors.length > 0) {
      console.log('\n⚠️  Errores encontrados:');
      notesResult.data.errors.forEach((err: any) => {
        console.log(`   - ${err.note}: ${err.error}`);
      });
    }
  } catch (error) {
    console.error('❌ Error crítico durante la migración:', error);
    process.exit(1);
  }
}

runMigration();
