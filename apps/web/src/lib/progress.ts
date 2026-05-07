// TODO: Wire to the real profile store (Zustand + IndexedDB) when that lands; this is the integration seam.

// ===== PROGRESS TRACKING =====

import type { LessonRef, TopicKey } from '@/types/schema.ts';
import { COURSE_CATALOG } from '@/data/courses.ts';

export interface ProfileStore {
  get(): { rpg: { lessons_completed: LessonRef[] } };
  save(profile: { rpg: { lessons_completed: LessonRef[] } }): void;
}

export function markLessonComplete(store: ProfileStore, topic: TopicKey, lessonId: number): boolean {
  const profile = store.get();

  if (!profile.rpg.lessons_completed.find(ref => ref.topic === topic && ref.lesson_id === lessonId)) {
    profile.rpg.lessons_completed.push({
      topic,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
    });
    store.save(profile);
    return true;
  }
  return false;
}

export function isLessonComplete(store: ProfileStore, topic: TopicKey, lessonId: number): boolean {
  const profile = store.get();
  return !!profile.rpg.lessons_completed.find(ref => ref.topic === topic && ref.lesson_id === lessonId);
}

export function getCompletedCount(store: ProfileStore, topic: TopicKey): number {
  const profile = store.get();
  let count = 0;
  for (const ref of profile.rpg.lessons_completed) {
    if (ref.topic === topic) count++;
  }
  return count;
}

export interface CourseProgress {
  completed: number;
  total: number;
  percent: number;
}

export function getCourseProgress(store: ProfileStore, topic: TopicKey): CourseProgress {
  const course = COURSE_CATALOG[topic];
  if (!course) return { completed: 0, total: 0, percent: 0 };
  const completed = getCompletedCount(store, topic);
  const total = course.lessons.length;
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
