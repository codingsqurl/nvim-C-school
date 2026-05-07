// TODO: Wire to the real profile store (Zustand + IndexedDB) when that lands; this is the integration seam.

// ===== PROGRESS TRACKING =====

import type { TopicKey } from '@/types/schema.ts';
import { COURSE_CATALOG } from '@/data/courses.ts';

export interface ProfileStore {
  get(): { stats: { topics_completed: string[] } };
  save(profile: { stats: { topics_completed: string[] } }): void;
}

export function markLessonComplete(store: ProfileStore, topic: TopicKey, lessonId: number): boolean {
  const profile = store.get();
  const lessonKey = `${topic}:${lessonId}`;

  if (!profile.stats.topics_completed.includes(lessonKey)) {
    profile.stats.topics_completed.push(lessonKey);
    store.save(profile);
    return true;
  }
  return false;
}

export function isLessonComplete(store: ProfileStore, topic: TopicKey, lessonId: number): boolean {
  const profile = store.get();
  return profile.stats.topics_completed.includes(`${topic}:${lessonId}`);
}

export function getCompletedCount(store: ProfileStore, topic: TopicKey): number {
  const profile = store.get();
  const prefix = `${topic}:`;
  return profile.stats.topics_completed.filter(k => k.startsWith(prefix)).length;
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
