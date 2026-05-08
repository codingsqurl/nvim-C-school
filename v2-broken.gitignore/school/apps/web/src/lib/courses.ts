// ===== COURSE LOADER & SEARCH =====

import type { TopicKey } from '@/types/schema.ts';
import { COURSE_CATALOG } from '@/data/courses.ts';
import { renderMarkdown } from '@/lib/markdown.ts';

export interface LoadCourseError {
  error: string;
}

export interface LoadCourseSuccess {
  topic: TopicKey;
  lessonId: number;
  title: string;
  file: string;
  level: string;
  courseName: string;
  courseIcon: string;
  html: string;
}

export type LoadCourseResult = LoadCourseError | LoadCourseSuccess;

export async function loadCourseContent(topic: TopicKey, lessonId: number): Promise<LoadCourseResult> {
  const course = COURSE_CATALOG[topic];
  if (!course) return { error: `Unknown topic: ${topic}` };

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) return { error: `Lesson ${lessonId} not found in ${topic}` };

  try {
    const resp = await fetch('/' + lesson.file);
    if (!resp.ok) {
      return { error: `Failed to load ${lesson.file}: ${resp.status} ${resp.statusText}` };
    }
    const rawMd = await resp.text();
    const html = renderMarkdown(rawMd);
    return {
      topic,
      lessonId,
      title: lesson.title,
      file: lesson.file,
      level: lesson.level,
      courseName: course.name,
      courseIcon: course.icon,
      html,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Network error loading ${lesson.file}: ${message}` };
  }
}

export interface SearchResult {
  topic: TopicKey;
  courseName: string;
  courseIcon: string;
  lessonId: number;
  lessonTitle: string;
  level: string;
  file: string;
  score: number;
}

export function searchCourses(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();

  const results: SearchResult[] = [];

  for (const [topic, course] of Object.entries(COURSE_CATALOG)) {
    // Match course name
    const courseNameMatch = course.name.toLowerCase().includes(q);
    const courseDescMatch = course.description.toLowerCase().includes(q);

    for (const lesson of course.lessons) {
      const titleMatch = lesson.title.toLowerCase().includes(q);
      const levelMatch = lesson.level.toLowerCase() === q;

      if (courseNameMatch || courseDescMatch || titleMatch || levelMatch) {
        results.push({
          topic,
          courseName: course.name,
          courseIcon: course.icon,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          level: lesson.level,
          file: lesson.file,
          score:
            (titleMatch ? 3 : 0) +
            (courseNameMatch ? 2 : 0) +
            (courseDescMatch ? 1 : 0) +
            (levelMatch ? 2 : 0),
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
