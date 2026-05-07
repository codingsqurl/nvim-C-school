import {
  SCHEMA_VERSION,
} from '@/types/schema.ts';
import type {
  Attributes,
  Audience,
  CodeBuildersAttributes,
  CodeKidsAttributes,
  LessonRef,
  Profile,
  ProfileStats,
  ProfileV1,
  RpgState,
} from '@/types/schema.ts';

export function defaultAttributes(audience: Audience): Attributes {
  if (audience === 'codekids') {
    const attrs: CodeKidsAttributes = {
      curiosity: 0,
      courage: 0,
      creativity: 0,
      kindness: 0,
    };
    return attrs;
  }
  const attrs: CodeBuildersAttributes = {
    logic: 0,
    systems: 0,
    craft: 0,
    speed: 0,
  };
  return attrs;
}

function freshRpgState(audience: Audience, lessonsCompleted: LessonRef[]): RpgState {
  return {
    level: 1,
    xp: 0,
    attributes: defaultAttributes(audience),
    lessons_completed: lessonsCompleted,
    quests: {},
    inventory: [],
    equipped: {},
    skills: { unlocked: [], levels: {} },
  };
}

function parseTopicsCompleted(entries: string[], completedAt: number): LessonRef[] {
  const refs: LessonRef[] = [];
  for (const entry of entries) {
    const idx = entry.indexOf(':');
    if (idx === -1) continue;
    const topic = entry.slice(0, idx);
    const idStr = entry.slice(idx + 1);
    if (!topic || !idStr) continue;
    const lessonId = Number(idStr);
    if (!Number.isFinite(lessonId) || Number.isNaN(lessonId)) continue;
    refs.push({ topic, lesson_id: lessonId, completed_at: completedAt });
  }
  return refs;
}

export function migrateV1ToV2(legacy: ProfileV1, audience: Audience): Profile {
  const lessonsCompleted = parseTopicsCompleted(
    legacy.stats.topics_completed,
    legacy.last_active,
  );
  const { topics_completed: _topics, ...statsRest } = legacy.stats;
  void _topics;
  const stats: ProfileStats = {
    commands_executed: statsRest.commands_executed,
    sessions_started: statsRest.sessions_started,
    time_spent: statsRest.time_spent,
    command_history: statsRest.command_history,
    current_dir: statsRest.current_dir,
    login_time: statsRest.login_time,
  };
  return {
    id: legacy.id,
    username: legacy.username,
    audience,
    created: legacy.created,
    last_active: legacy.last_active,
    colorscheme_index: legacy.colorscheme_index,
    stats,
    rpg: freshRpgState(audience, lessonsCompleted),
    schema_version: SCHEMA_VERSION,
  };
}

export function createFreshProfile(audience: Audience, username: string): Profile {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    username,
    audience,
    created: now,
    last_active: now,
    colorscheme_index: 0,
    stats: {
      commands_executed: 0,
      sessions_started: 0,
      time_spent: 0,
      command_history: [],
      current_dir: '~',
      login_time: now,
    },
    rpg: freshRpgState(audience, []),
    schema_version: SCHEMA_VERSION,
  };
}
