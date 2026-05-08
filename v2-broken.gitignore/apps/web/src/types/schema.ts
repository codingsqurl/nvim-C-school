// nvim-c-school / CodeKids — shared data model.
//
// All design TODOs from the prior draft are resolved. Decisions are recorded
// in section 12 with rationale. Treat this file as the canonical schema; the
// production copy lives at apps/web/src/types/schema.ts once scaffolded.
//
// Audience split (load-bearing for the entire schema):
//   codekids      = ages 5–11. 2D world map. Heavily gamified. No terminal.
//   codebuilders  = older learners. Skill-tree × abstract grid map. Terminal
//                   subsystem lives here.
//
// Shared underneath both audiences:
//   - content layer (SCHOOL/ markdown lessons — existing)
//   - RPG progression (level/xp, attributes, inventory, equipment, skills)
//   - quest system (lesson-wrappers + standalone challenges)


// =============================================================================
// 1. PRIMITIVES
// =============================================================================

export type Audience = 'codekids' | 'codebuilders';

export type IsoTimestamp = number;          // milliseconds since epoch (Date.now())
export type ProfileId = string;
export type ItemId = string;
export type SkillId = string;
export type SkillNodeId = string;
export type RegionId = string;
export type QuestId = string;
export type TopicKey = string;              // matches keys in COURSE_CATALOG (linux, python, ...)
export type SchoolId =
  | 'foundations_academy'
  | 'builders_workshop'
  | 'systems_lab'
  | 'creators_studio';
export type MilestoneId = string;           // e.g. "FA-B", "BW-I"


// =============================================================================
// 2. LESSONS — bridge to existing courses.js shape
// =============================================================================

export interface Course {
  name: string;
  icon: string;
  tag: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  title: string;
  file: string;                              // path under SCHOOL/
  level: string;                             // e.g. "intuition"
}

export interface LessonRef {
  topic: TopicKey;
  lesson_id: number;
  completed_at: IsoTimestamp;
}


// =============================================================================
// 3. ATTRIBUTES — per-audience axes
// =============================================================================
// Decision (see §12.2): different attribute axes per audience. Tech jargon is
// wrong for 5-year-olds; abstract traits are wrong for adult learners. Items
// and skills target a specific audience or both, so an attribute key only ever
// resolves against the correct attribute set for the player's audience.

export type CodeKidsAttributeKey = 'curiosity' | 'courage' | 'creativity' | 'kindness';
export type CodeBuildersAttributeKey = 'logic' | 'systems' | 'craft' | 'speed';
export type AttributeKey = CodeKidsAttributeKey | CodeBuildersAttributeKey;

export type CodeKidsAttributes = Record<CodeKidsAttributeKey, number>;
export type CodeBuildersAttributes = Record<CodeBuildersAttributeKey, number>;

export type BrandedCodeKidsAttributes = CodeKidsAttributes & { _audience: 'codekids' };
export type BrandedCodeBuildersAttributes = CodeBuildersAttributes & { _audience: 'codebuilders' };
export type Attributes = BrandedCodeKidsAttributes | BrandedCodeBuildersAttributes;


// =============================================================================
// 4. INVENTORY & EQUIPMENT
// =============================================================================

export type EquipSlot =
  | 'prompt'      // terminal prompt style — codebuilders only
  | 'theme'       // colorscheme override — both audiences
  | 'cursor'      // cursor style/animation — codebuilders only
  | 'companion'   // pet/familiar shown in CodeKids overworld — codekids primary
  | 'tool';       // grants in-quest abilities — both audiences

// Decision (see §12.3): slots are filtered per audience at the catalog level.
// CodeKids effectively sees {theme, companion, tool}; CodeBuilders sees all five.
export const SLOTS_BY_AUDIENCE: Record<Audience, readonly EquipSlot[]> = {
  codekids:    ['theme', 'companion', 'tool'],
  codebuilders: ['prompt', 'theme', 'cursor', 'companion', 'tool'],
};

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ItemDef {                   // catalog entry, not per-player
  id: ItemId;
  name: string;
  description: string;
  audience: Audience | 'both';
  slot: EquipSlot | null;                    // null = consumable / non-equippable
  rarity: ItemRarity;
  effects: ItemEffect[];
}

export type ItemEffect =
  | { kind: 'attribute_bonus'; attribute: AttributeKey; amount: number }
  | { kind: 'xp_multiplier'; topic: TopicKey | '*'; multiplier: number }
  | { kind: 'unlock_command'; command: string }            // codebuilders terminal
  | { kind: 'cosmetic' };

export interface InventoryItem {
  id: ItemId;
  count: number;                             // stacks for consumables; 1 for equipment
}

export type EquippedSlots = Partial<Record<EquipSlot, ItemId>>;

export function validateEquippedSlots(slots: EquippedSlots, audience: Audience): EquippedSlots {
  const allowed = new Set<string>(SLOTS_BY_AUDIENCE[audience]);
  const valid: EquippedSlots = {};
  for (const [slot, itemId] of Object.entries(slots)) {
    if (allowed.has(slot) && itemId !== undefined) {
      valid[slot as EquipSlot] = itemId;
    }
  }
  return valid;
}


// =============================================================================
// 5. SKILLS
// =============================================================================
// Decision (see §12.4): MVP uses auto-from-lesson-completion only. No skill
// points, no spending. Adds simplicity at the cost of less player agency. Add
// 'point_spend' later if depth warrants.

export interface SkillState {
  unlocked: SkillId[];
  levels: Record<SkillId, number>;            // default 0 if absent
}

export interface SkillDef {                   // catalog entry
  id: SkillId;
  name: string;
  description: string;
  audience: Audience | 'both';
  topic: TopicKey;
  max_level: number;
  prerequisites: SkillId[];
  unlock: { kind: 'auto'; lessons_in_topic: number };
  // Future: extend `unlock` to a discriminated union when point-spend lands.
}


// =============================================================================
// 6. QUESTS
// =============================================================================

export type Quest = LessonQuest | ChallengeQuest;

interface QuestBase {
  id: QuestId;
  name: string;
  description: string;
  audience: Audience | 'both';
  region?: RegionId;                          // codekids — placement on 2D map
  skill_node?: SkillNodeId;                   // codebuilders — placement in skill tree
  rewards: QuestReward[];
  prerequisites: QuestId[];
}

export interface LessonQuest extends QuestBase {
  kind: 'lesson';
  required_lessons: { topic: TopicKey; lesson_id: number }[];
}

export interface ChallengeQuest extends QuestBase {
  kind: 'challenge';
  prompt: string;
  verifier: ChallengeVerifier;
}

// Decision (see §12.5): MVP supports output_match and regex_match only.
// test_runner is part of the type but explicitly NOT implemented in v1 — it
// requires a sandboxed execution layer (Phase 3+). Use it as a placeholder so
// future quest content authoring tools can target it.
export type ChallengeVerifier =
  | { kind: 'output_match'; expected: string; case_sensitive: boolean }
  | { kind: 'regex_match'; pattern: string }
  | { kind: 'test_runner'; runner_id: string };  // PHASE 3+ — not in v1

export type QuestReward =
  | { kind: 'xp'; amount: number }
  | { kind: 'item'; item_id: ItemId; count: number }
  | { kind: 'unlock_quest'; quest_id: QuestId }
  | { kind: 'unlock_region'; region_id: RegionId };
// 'skill_point' reward removed — skills auto-unlock from lessons in MVP.

export type QuestStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface QuestProgress {
  status: QuestStatus;
  completed_at?: IsoTimestamp;
  attempts?: number;                          // ChallengeQuest only
  last_submission?: string;                   // ChallengeQuest only
}

export type QuestProgressMap = Record<QuestId, QuestProgress>;


// =============================================================================
// 7. RPG STATE — composes everything above
// =============================================================================

export interface RpgState {
  level: number;
  xp: number;                                 // XP toward next level
  attributes: Attributes;                     // shape determined by Profile.audience
  lessons_completed: LessonRef[];
  quests: QuestProgressMap;
  inventory: InventoryItem[];
  equipped: EquippedSlots;
  skills: SkillState;
}
// `attribute_points` removed alongside the simplified skill model — players
// don't allocate; attributes grow via XP/leveling rules defined in code.


// =============================================================================
// 8. PROFILE — extends current localStorage shape from index.html
// =============================================================================

export const SCHEMA_VERSION = 2 as const;
export type SchemaVersion = typeof SCHEMA_VERSION;

export interface Profile {
  id: ProfileId;
  username: string;
  audience: Audience;                         // drives all UI/route decisions
  created: IsoTimestamp;
  last_active: IsoTimestamp;
  colorscheme_index: number;                  // index into colorschemes[] in index.html
  stats: ProfileStats;
  rpg: RpgState;
  schema_version: SchemaVersion;
}

export interface ProfileStats {
  commands_executed: number;
  sessions_started: number;
  time_spent: number;                         // seconds
  command_history: string[];
  current_dir: string;
  login_time: IsoTimestamp;
}

// Legacy v1 profile shape (pre-RPG). Used only by the migrator below.
export interface ProfileV1 {
  id: ProfileId;
  username: string;
  created: IsoTimestamp;
  last_active: IsoTimestamp;
  colorscheme_index: number;
  stats: ProfileStats & { topics_completed: string[] };
  schema_version?: 1;
}


// =============================================================================
// 9. MAP — CodeKids (2D world)
// =============================================================================
// Decision (see §12.6): hand-author a static list of regions. ~12 named
// regions, one per COURSE_CATALOG topic. Static data file under
// apps/web/src/data/regions.ts.

export interface Region {
  id: RegionId;
  name: string;                               // e.g. "Linux Forest", "Python Pier"
  topic: TopicKey;
  position: { x: number; y: number };         // grid coords on the world map
  unlock: { quest?: QuestId; level?: number };
  quests: QuestId[];
  art_key?: string;                           // sprite/asset reference
}


// =============================================================================
// 10. MAP — CodeBuilders+ (skill-tree × abstract grid)
// =============================================================================
// Decision (see §12.7): hand-author positions for MVP. Move to auto-layout
// (dagre/elk) when node count > ~50.

export interface SkillNode {
  id: SkillNodeId;
  kind: 'lesson' | 'quest' | 'milestone';
  ref: LessonNodeRef | QuestId | MilestoneId;
  position: { x: number; y: number };         // abstract grid coords
  prerequisites: SkillNodeId[];               // edges into this node
  school?: SchoolId;
}

export interface LessonNodeRef {
  topic: TopicKey;
  lesson_id: number;
}


// =============================================================================
// 11. STATIC CATALOGS (definitions, not player state)
// =============================================================================
// These live in code/data, not in IndexedDB. Bundled with the build. Player
// state in Profile/RpgState references them by id.

export interface GameCatalog {
  courses: Record<TopicKey, Course>;          // ported from COURSE_CATALOG
  items: Record<ItemId, ItemDef>;
  skills: Record<SkillId, SkillDef>;
  quests: Record<QuestId, Quest>;
  regions: Record<RegionId, Region>;          // codekids map
  skill_nodes: Record<SkillNodeId, SkillNode>; // codebuilders map
}


// =============================================================================
// 12. DECISIONS — resolved 2026-05-06
// =============================================================================
//
// 12.1 Audience selection flow
//   Self-select on first visit with a description of each path. A future
//   "classroom mode" can lock the selection (parent/teacher sets audience for
//   children); design for it but don't build it now. Stored in Profile.audience.
//
// 12.2 Attribute axes — per-audience
//   CodeKids:     curiosity, courage, creativity, kindness  (character-trait framing)
//   CodeBuilders: logic, systems, craft, speed              (technical axes)
//   Reason: attribute names appear throughout the UI; one set can't serve both.
//
// 12.3 Equip slots
//   Five total: prompt, theme, cursor, companion, tool.
//   Filtered per audience via SLOTS_BY_AUDIENCE — CodeKids sees three.
//
// 12.4 Skill unlock model
//   MVP: auto-from-lesson-completion only. No skill points. Simpler UI, less
//   player agency. Reintroduce 'point_spend' as a discriminated variant of
//   SkillDef.unlock when depth requires it.
//
// 12.5 Challenge verifier set for MVP
//   output_match + regex_match. test_runner is reserved in the type but only
//   implemented in Phase 3+ (requires sandbox).
//
// 12.6 CodeKids map authorship
//   Hand-authored. ~12 named regions, one per topic. Static module:
//   apps/web/src/data/regions.ts.
//
// 12.7 CodeBuilders skill-tree layout
//   Hand-authored coords for MVP. Auto-layout when node count > ~50.
//
// 12.8 Profile v1 → v2 migration
//   On first load, if loaded profile has schema_version !== 2:
//     1. Build RpgState: level=1, xp=0, attributes=defaults for chosen audience,
//        empty inventory/equipped/quests, skills=empty,
//        lessons_completed seeded from v1 stats.topics_completed (each
//        "topic:lessonId" string parsed; completed_at = profile.last_active).
//     2. Prompt for audience selection (cannot infer from v1 data).
//     3. Set schema_version: 2; persist immediately.
//   The migrator runs once per profile and is idempotent (returns input if
//   already v2).
//
// 12.9 Persistence split
//   Profile (per-player, mutable) → IndexedDB.
//   GameCatalog (static, immutable per build) → bundled TS modules under
//   apps/web/src/data/. No need to hydrate from the server.
//
// 12.10 Backend authority
//   Local-first. IndexedDB is the source of truth for Profile. Server endpoint
//   /api/profile/save (already in index.html) receives best-effort writes for
//   backup/cross-device only. Never block UI on server response. Matches the
//   existing fire-and-forget pattern in index.html getUserProfile/saveUserProfile.
