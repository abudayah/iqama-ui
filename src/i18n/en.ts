/**
 * English strings for the iqama UI.
 *
 * `I18nKeys` is the single source of truth for the key shape; `ar.ts` is typed
 * against it so a missing or extra key fails `tsc`.
 */
export interface I18nKeys {
  nav: {
    iqama: string;
    weeklyView: string;
    ramadanEid: string;
    adhan: string;
  };
  common: {
    retry: string;
    refresh: string;
    cancel: string;
    saving: string;
    loading: string;
    back: string;
    dismiss: string;
    details: string;
  };
  lang: {
    switchToEnglish: string;
    switchToArabic: string;
  };
  prayers: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    friday: string;
    qiyam: string;
    eid1: string;
    eid2: string;
    firstPrayer: string;
    secondPrayer: string;
    previewAria: string;
  };
  admin: {
    back: string;
    backAria: string;
    clearing: string;
    cacheCleared: string;
    failed: string;
    clearCache: string;
    clearCacheTitle: string;
    signOut: string;
    iqamaTabs: string;
    overrides: string;
    rules: string;
    unsavedDot: string;
  };
  footer: {
    aria: string;
    masjidName: string;
    directions: string;
    directionsAria: string;
    install: string;
    installAria: string;
    adminAria: string;
  };
  offline: {
    message: string;
  };
  overrides: {
    title: string;
    refresh: string;
    refreshAria: string;
    newOverride: string;
  };
  hero: {
    azanIn: string;
    eidPrayerIn: string;
    sunriseIn: string;
    nextPrayer: string;
    timeUntilIqama: string;
    allComplete: string;
    at: string;
    iqamaAt: string;
    azanAt: string;
    aria: string;
  };
  prayerTable: {
    today: string;
    tomorrow: string;
    loadingTomorrow: string;
    loadingAria: string;
  };
  rules: {
    unsavedChanges: string;
    newlyMoved: string;
    understandFajr: string;
    title: string;
    loadingAria: string;
    discard: string;
    reviewAndSave: string;
    edited: string;
    noRules: string;
    invalid: string;
    buildOn: string;
    saved: string;
    publicScheduleNote: string;
    review: {
      save: string;
      reason: string;
      reasonOptional: string;
      title: string;
      effectiveFrom: string;
      upcomingFridays: string;
      fridayShort: string;
      fridayError: string;
      checking: string;
      noTimeChanges: string;
      changesEveryDay: string;
      changesOn: string;
      newlyMovedWarning: string;
      conflictTitle: string;
      conflictListed: string;
      conflictLine: string;
      understandLabel: string;
      understandAria: string;
      staleNotice: string;
      reloadLatest: string;
      details: string;
      daysChanged: string;
      daysMoved: string;
      movedSummary: string;
      tablePrayer: string;
      tableChanged: string;
      tableMoved: string;
      firstChanged: string;
      firstNewlyMoved: string;
      firstMoved: string;
      cancel: string;
      saving: string;
    };
    guardrails: {
      title: string;
      minGap: string;
      fajrLimit: string;
      fajrConflict: string;
      step: string;
      fridayStart: string;
      anyDay: string;
      footnote: string;
    };
    versions: {
      aria: string;
      editingOn: string;
      upcomingNote: string;
      inForce: string;
      scheduled: string;
      history: string;
      version: string;
      from: string;
      saved: string;
    };
    notices: {
      overlaps: string;
      useSaved: string;
      useSavedAria: string;
      dateMoved: string;
    };
    errors: {
      saveFailed: string;
    };
  };
}

const en: I18nKeys = {
  nav: {
    iqama: 'Iqama',
    weeklyView: 'Weekly View',
    ramadanEid: 'Ramadan & Eid',
    adhan: 'Adhan',
  },
  common: {
    retry: 'Retry',
    refresh: 'Refresh',
    cancel: 'Cancel',
    saving: 'Saving…',
    loading: 'Loading',
    back: 'Back',
    dismiss: 'Dismiss',
    details: 'Details',
  },
  lang: {
    switchToEnglish: 'Switch to English',
    switchToArabic: 'التبديل إلى العربية',
  },
  prayers: {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    friday: 'Friday',
    qiyam: 'Qiyam',
    eid1: '1st Eid Prayer',
    eid2: '2nd Eid Prayer',
    firstPrayer: '1st Prayer',
    secondPrayer: '2nd Prayer',
    previewAria: 'Preview {{prayer}} prayer time',
  },
  admin: {
    back: 'Back',
    backAria: 'Back to prayer times',
    clearing: 'Clearing…',
    cacheCleared: '✓ Cache cleared',
    failed: '✗ Failed',
    clearCache: '🗑 Clear cache',
    clearCacheTitle: 'Clear server schedule cache',
    signOut: 'Sign out',
    iqamaTabs: 'Iqama',
    overrides: 'Overrides',
    rules: 'Rules',
    unsavedDot: 'unsaved changes',
  },
  footer: {
    aria: 'Site footer',
    masjidName: 'Masjid Al-Hidayah',
    directions: 'Directions',
    directionsAria: 'Get directions to Masjid Al-Hidayah',
    install: 'Install',
    installAria: 'Install this app on your device',
    adminAria: 'Admin panel',
  },
  offline: {
    message: 'You are offline. Prayer times may not be up to date.',
  },
  overrides: {
    title: 'Overrides',
    refresh: 'Refresh',
    refreshAria: 'Refresh overrides',
    newOverride: '+ New Override',
  },
  hero: {
    azanIn: 'AZAN IN',
    eidPrayerIn: 'EID PRAYER IN',
    sunriseIn: 'SUNRISE IN',
    nextPrayer: 'NEXT PRAYER',
    timeUntilIqama: 'TIME UNTIL IQAMA',
    allComplete: 'All prayers complete',
    at: '{{prayer}} · at {{time}}',
    iqamaAt: '{{prayer}} · Iqama at {{time}}',
    azanAt: '{{prayer}} · Azan at {{time}}',
    aria: 'Prayer hero banner',
  },
  prayerTable: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    loadingTomorrow: 'Loading tomorrow…',
    loadingAria: 'Loading',
  },
  rules: {
    unsavedChanges: 'Unsaved changes',
    newlyMoved: 'will be moved by safety rules',
    understandFajr: 'I understand Fajr will be less than {{min}} min before sunrise on these days',
    title: 'Iqama rules',
    loadingAria: 'Loading Iqama rules',
    discard: 'Discard',
    reviewAndSave: 'Review & save',
    edited: 'Edited',
    noRules:
      'No rules are saved on the engine yet, so there is nothing to edit. Seed the engine first.',
    invalid:
      'Version {{version}} is stored but invalid ({{error}}). Editing is off until it is fixed on the engine.',
    buildOn: 'Building on version {{version}} (effective {{date}}).',
    saved: 'Rules saved and published.',
    publicScheduleNote: 'The public schedule uses these rules.',
    review: {
      save: 'Save rules',
      reason: 'Reason for change',
      reasonOptional: '(optional)',
      title: 'Review changes',
      effectiveFrom: 'Effective from',
      upcomingFridays: 'Upcoming Fridays',
      fridayShort: 'Fri {{date}}',
      fridayError: '{{prayers}} can only change on a Friday. Pick a Friday.',
      checking: 'Checking the next 365 days…',
      noTimeChanges: 'No time changes',
      changesEveryDay: 'Changes every day',
      changesOn: 'Changes on {{n}} day{{s}}',
      newlyMovedWarning: '⚠ {{n}} day{{s}} will be moved by safety rules',
      conflictTitle: 'Fajr will be too close to sunrise on {{n}} day{{s}}',
      conflictListed: '(first {{m}} listed)',
      conflictLine: '{{date}}: iqama {{iqama}}, sunrise {{sunrise}}',
      understandLabel: 'I understand this will change the prayer times shown to the community.',
      understandAria: 'I understand this changes times shown to the community',
      staleNotice:
        'The rules changed on the engine since you opened this page. Reload to see the latest rules. Your edits are kept and applied on top of them.',
      reloadLatest: 'Reload latest rules',
      details: 'Details',
      daysChanged: '{{n}} day{{s}} changed (of {{total}})',
      daysMoved: '{{n}} day{{s}} moved by safety rules',
      movedSummary: 'Moved by safety rules: {{already}} already today, {{n}} new from this change.',
      tablePrayer: 'Prayer',
      tableChanged: 'Changed',
      tableMoved: 'Moved by safety rules',
      firstChanged: 'First changed:',
      firstNewlyMoved: 'First newly moved:',
      firstMoved: 'First moved by safety rules:',
      cancel: 'Cancel',
      saving: 'Saving…',
    },
    guardrails: {
      title: 'Always applied',
      minGap: 'Iqama is never earlier than {{min}} min after Azan (all prayers, overrides too).',
      fajrLimit: 'Fajr iqama is normally at least {{min}} min before sunrise.',
      fajrConflict:
        'If that clashes with the {{min}}-min minimum, the minimum wins, the day is flagged as a conflict, and you must acknowledge it before saving.',
      step: 'Every iqama lands on a {{min}}-minute mark (e.g. 9:04 becomes 9:{{example}}).',
      fridayStart: 'Rule changes for {{prayers}} must start on a Friday.',
      anyDay: '{{prayers}} can start any day.',
      footnote: 'These cannot be changed here. Times they move are marked “adjusted”.',
    },
    versions: {
      aria: 'Rule versions',
      editingOn: 'Editing on top of version {{version}} (effective {{date}}).',
      upcomingNote: 'Prayers you do not edit keep the rules of the scheduled versions below.',
      inForce: 'In force today',
      scheduled: 'Scheduled',
      history: 'Version history ({{n}})',
      version: 'Version {{id}}',
      from: 'from {{date}}',
      saved: 'Saved {{date}}',
    },
    notices: {
      overlaps: '{{prayer}} was changed by another save: your version is kept, review it.',
      useSaved: 'Use the saved version instead',
      useSavedAria: 'Use the saved version instead for {{prayer}}',
      dateMoved:
        'The effective date moved to {{date}}, because the newest version starts later than the date you chose.',
    },
    errors: {
      saveFailed: 'Failed to save',
    },
  },
};

export default en;
