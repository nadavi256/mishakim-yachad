/** Technical recommendations from the spec, kept in one place for a future server check. */
export const LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMax: 2000,
  meetingNoteMax: 500,
  bioMax: 500,
  chatMax: 2000,
  displayNameMax: 80,
} as const;
