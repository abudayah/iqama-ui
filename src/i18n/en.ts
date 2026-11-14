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
    save: string;
  };
  lang: {
    switchToEnglish: string;
    switchToArabic: string;
  };
  gate: {
    loginTitle: string;
    loginSubtitle: string;
    password: string;
    passwordPlaceholder: string;
    signIn: string;
    configureTitle: string;
    configureSubtitle: string;
    baseUrl: string;
    invalidUrl: string;
  };
  simulator: {
    activeAria: string;
    active: string;
    exit: string;
    exitAria: string;
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
    emptyTitle: string;
    emptyHint: string;
    deleteConfirm: string;
    active: string;
    inactive: string;
    clampWarning: string;
    edit: string;
    delete: string;
    editAria: string;
    deleteAria: string;
  };
  overrideForm: {
    newTitle: string;
    editTitle: string;
    prayer: string;
    type: string;
    fixed: string;
    offset: string;
    timeLabel: string;
    offsetLabel: string;
    stepHint: string;
    startDate: string;
    endDate: string;
    save: string;
    offsetAria: string;
    minShort: string;
    errors: {
      time: string;
      startRequired: string;
      endRequired: string;
      endBeforeStart: string;
      saveFailed: string;
    };
  };
  schedule: {
    week: string;
    selectWeek: string;
    current: string;
    conflict: string;
    customizedAzan: string;
    noData: string;
  };
  ramadan: {
    moonSighting: string;
    currentHijriMonth: string;
    monthLength: string;
    astronomical: string;
    astronomicalSub: string;
    days29: string;
    days29Sub: string;
    days30: string;
    days30Sub: string;
    resetPrompt: string;
    savedSuccess: string;
    saveFailed: string;
    eidPrayerTimes: string;
    editTimes: string;
    noPrayerTimes: string;
    prayerTimesAfterOverride: string;
    qiyamTitle: string;
    qiyamStartTime: string;
    qiyamStartAria: string;
    qiyamActiveNights: string;
    qiyamNote: string;
    qiyamSaved: string;
    saveQiyam: string;
    eidFitrName: string;
    eidAdhaName: string;
    eidFitrWillFall: string;
    eidAdhaWillFall: string;
    monthWillBeDays_one: string;
    monthWillBeDays_other: string;
  };
  eidCard: {
    preliminary: string;
  };
  eidModal: {
    fitrTitle: string;
    adhaTitle: string;
    fitrMessage: string;
    adhaMessage: string;
    first: string;
    second: string;
    firstAria: string;
    secondAria: string;
    submitFailed: string;
    confirm: string;
  };
  adhanConfig: {
    overview: string;
    periods: string;
    loadingAria: string;
    unsavedChanges: string;
    discard: string;
    reviewAndSave: string;
    configVersion: string;
    lastUpdated: string;
    prayerOffsets: string;
    noConfiguration: string;
    generalSettings: string;
    edit: string;
    timezone: string;
    location: string;
    method: string;
    madhab: string;
    highLatitude: string;
    readOnly: string;
    recommended: string;
    savedToast: string;
    previewFailed: string;
    saveFailed: string;
    editOffsetAria: string;
    customized: string;
    draft: string;
  };
  adhanPeriods: {
    title: string;
    add: string;
    emptyTitle: string;
    emptyHint: string;
    edit: string;
    delete: string;
    editAria: string;
    deleteAria: string;
    deleteConfirm: string;
    statusActive: string;
    statusUpcoming: string;
    statusPast: string;
    noChanges: string;
    methodSummary: string;
    highLatSummary: string;
    deleteFailed: string;
  };
  adhanPeriodForm: {
    editTitle: string;
    newTitle: string;
    name: string;
    namePlaceholder: string;
    startDate: string;
    endDate: string;
    offsets: string;
    min: string;
    saveChanges: string;
    create: string;
    failed: string;
  };
  adhanGeneral: {
    title: string;
    close: string;
    calculationMethod: string;
    fajrAngle: string;
    ishaAngle: string;
    anglesRange: string;
    madhab: string;
    highLatitude: string;
    recommended: string;
    recommendedForLocation: string;
    advanced: string;
    rounding: string;
    cancel: string;
    addToChanges: string;
  };
  adhanPrayerDrawer: {
    title: string;
    close: string;
    azanOffset: string;
    noOffset: string;
    later: string;
    earlier: string;
    min: string;
    valueAria: string;
    sliderAria: string;
    decrease: string;
    increase: string;
    reset: string;
    largeWarning: string;
    cancel: string;
    addToChanges: string;
    ruleDhuhr: string;
    ruleAsr: string;
  };
  adhanReview: {
    title: string;
    proposed: string;
    setting: string;
    before: string;
    after: string;
    loadingPreview: string;
    noChanges: string;
    warnings: string;
    understand: string;
    understandAria: string;
    cancel: string;
    apply: string;
    calculationMethod: string;
    madhab: string;
    highLatitude: string;
    rounding: string;
    prayerOffset: string;
    shafaq: string;
  };
  methods: {
    NorthAmerica: string;
    MuslimWorldLeague: string;
    Egyptian: string;
    Karachi: string;
    UmmAlQura: string;
    Dubai: string;
    MoonsightingCommittee: string;
    Kuwait: string;
    Qatar: string;
    Singapore: string;
    Tehran: string;
    Turkey: string;
    Other: string;
  };
  highLat: {
    MiddleOfTheNight: string;
    SeventhOfTheNight: string;
    TwilightAngle: string;
  };
  madhabLabels: {
    shafi: string;
    hanafi: string;
  };
  roundingLabels: {
    Nearest: string;
    Up: string;
    None: string;
  };
  shafaqLabels: {
    General: string;
    Ahmer: string;
    Abyad: string;
  };
  ruleEditor: {
    choose: string;
    remove: string;
    add: string;
    removeAria: string;
    itemAria: string;
    range: string;
    sheetTitle: string;
    ruleType: string;
    modifiers: string;
    next7Days: string;
    loadingPreview: string;
    adjusted: string;
    movedBySafety: string;
    fillRed: string;
    iqamaRule: string;
    close: string;
    cancel: string;
    addToChanges: string;
  };
  ruleDescribe: {
    min: string;
    atAzan: string;
    azan: string;
    fixed: string;
    scaled: string;
    seasonal_one: string;
    seasonal_other: string;
    roundUp: string;
    roundDown: string;
    roundNearest: string;
    minAfterAzan: string;
    minBeforeSunrise: string;
    weeklyLock: string;
  };
  events: {
    newYear: string;
    ashura: string;
    isra: string;
    ramadan: string;
    eidFitr: string;
    hajj: string;
    arafah: string;
    eidAdha: string;
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
      changesOn_one: string;
      changesOn_other: string;
      changesOn_two?: string;
      changesOn_few?: string;
      changesOn_many?: string;
      newlyMovedWarning_one: string;
      newlyMovedWarning_other: string;
      newlyMovedWarning_two?: string;
      newlyMovedWarning_few?: string;
      newlyMovedWarning_many?: string;
      conflictTitle_one: string;
      conflictTitle_other: string;
      conflictTitle_two?: string;
      conflictTitle_few?: string;
      conflictTitle_many?: string;
      conflictListed: string;
      conflictLine: string;
      understandLabel: string;
      understandAria: string;
      staleNotice: string;
      reloadLatest: string;
      details: string;
      daysChanged_one: string;
      daysChanged_other: string;
      daysChanged_two?: string;
      daysChanged_few?: string;
      daysChanged_many?: string;
      daysMoved_one: string;
      daysMoved_other: string;
      daysMoved_two?: string;
      daysMoved_few?: string;
      daysMoved_many?: string;
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
      /** Arabic plural form (3–10) for `minGap`; English falls back to `minGap`. */
      minGap_few?: string;
      fajrLimit: string;
      fajrLimit_few?: string;
      fajrConflict: string;
      fajrConflict_few?: string;
      step: string;
      step_few?: string;
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
    save: 'Save',
  },
  lang: {
    switchToEnglish: 'Switch to English',
    switchToArabic: 'التبديل إلى العربية',
  },
  gate: {
    loginTitle: 'Admin Login',
    loginSubtitle: 'Enter your password to access the admin panel.',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    signIn: 'Sign In',
    configureTitle: 'Configure API',
    configureSubtitle: 'Enter the backend API base URL to get started.',
    baseUrl: 'API Base URL',
    invalidUrl: 'Invalid URL',
  },
  simulator: {
    activeAria: 'Simulator mode active',
    active: 'Simulator active — {{date}} at {{time}}',
    exit: 'Exit',
    exitAria: 'Exit simulator',
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
    emptyTitle: 'No overrides yet.',
    emptyHint: 'Create your first override to adjust iqama times.',
    deleteConfirm: 'Are you sure you want to delete this override?',
    active: 'Active',
    inactive: 'Inactive',
    clampWarning:
      '⚠ Safety limits change this time on some days (minimum gap after Azan, or Fajr before sunrise).',
    edit: 'Edit',
    delete: 'Delete',
    editAria: 'Edit override for {{prayer}}',
    deleteAria: 'Delete override for {{prayer}}',
  },
  overrideForm: {
    newTitle: 'New Override',
    editTitle: 'Edit Override',
    prayer: 'Prayer',
    type: 'Type',
    fixed: 'Fixed',
    offset: 'Offset',
    timeLabel: 'Time (HH:mm)',
    offsetLabel: 'Offset (minutes)',
    stepHint:
      'Iqama times are on a 5-minute mark. The final time can be moved further to keep the safety rules (minimum gap after Azan, Fajr before sunrise). The schedule and the warning on this page show the real time.',
    startDate: 'Start Date',
    endDate: 'End Date',
    save: 'Save',
    offsetAria: 'Offset in minutes',
    minShort: 'min',
    errors: {
      time: 'Enter a valid time (HH:mm, e.g. 05:45)',
      startRequired: 'Start date is required',
      endRequired: 'End date is required',
      endBeforeStart: 'End date must be on or after start date',
      saveFailed: 'Save failed',
    },
  },
  schedule: {
    week: 'Week',
    selectWeek: 'Select week',
    current: 'current',
    conflict: 'Conflict',
    customizedAzan: 'Customized Azan time',
    noData: 'No schedule data available.',
  },
  ramadan: {
    moonSighting: 'Moon Sighting',
    currentHijriMonth: 'Current Hijri month',
    monthLength: 'Month length',
    astronomical: 'Astronomical',
    astronomicalSub: 'default',
    days29: '29 Days',
    days29Sub: 'moon sighted',
    days30: '30 Days',
    days30Sub: 'complete',
    resetPrompt: 'Reset to astronomical calendar?',
    savedSuccess: 'Moon sighting saved successfully.',
    saveFailed: 'Failed to save. Please try again.',
    eidPrayerTimes: 'Eid Prayer Times',
    editTimes: 'Edit times',
    noPrayerTimes: 'No prayer times saved yet',
    prayerTimesAfterOverride:
      'Prayer times will be set once the moon-sighting override is submitted',
    qiyamTitle: 'Qiyam al-Layl',
    qiyamStartTime: 'Qiyam Start Time',
    qiyamStartAria: 'Qiyam start time',
    qiyamActiveNights: 'Active nights: 20th–29th Ramadan',
    qiyamNote:
      "Shown in the app as 'Qiyam' with start time only. Applies to all 10 nights — adjust each year when Ramadan begins.",
    qiyamSaved: 'Qiyam time saved successfully.',
    saveQiyam: 'Save Qiyam time',
    eidFitrName: 'Eid al-Fitr',
    eidAdhaName: 'Eid al-Adha',
    eidFitrWillFall: 'Eid al-Fitr will fall on {{date}}',
    eidAdhaWillFall: 'Eid al-Adha will fall on {{date}}',
    monthWillBeDays_one: 'Month will be {{count}} day',
    monthWillBeDays_other: 'Month will be {{count}} days',
  },
  eidCard: {
    preliminary: 'Preliminary times — subject to moon-sighting confirmation',
  },
  eidModal: {
    fitrTitle: 'Confirm Eid al-Fitr Prayers',
    adhaTitle: 'Confirm Eid al-Adha Prayers',
    fitrMessage:
      'Based on your selection, the 1st of Shawwal will be on {{date}}. Please confirm the prayer timings.',
    adhaMessage:
      'Based on your selection, Eid al-Adha (10th of Dhul-Hijjah) will be on {{date}}. Please confirm the prayer timings.',
    first: '1st Prayer',
    second: '2nd Prayer',
    firstAria: '1st Prayer time',
    secondAria: '2nd Prayer time',
    submitFailed: 'Submission failed. Please try again.',
    confirm: 'Confirm',
  },
  adhanConfig: {
    overview: 'Overview',
    periods: 'Periods',
    loadingAria: 'Loading Adhan configuration',
    unsavedChanges: 'Unsaved changes',
    discard: 'Discard',
    reviewAndSave: 'Review & save',
    configVersion: 'Config v{{version}}',
    lastUpdated: 'Last updated {{date}}',
    prayerOffsets: 'Prayer Azan offsets',
    noConfiguration: 'No configuration found. Please run the seed migration.',
    generalSettings: 'General settings',
    edit: 'Edit',
    timezone: 'Timezone',
    location: 'Location',
    method: 'Method',
    madhab: 'Madhab',
    highLatitude: 'High latitude',
    readOnly: '(read-only)',
    recommended: '(recommended)',
    savedToast: 'Settings saved. The public schedule has been updated.',
    previewFailed: 'Preview failed',
    saveFailed: 'Failed to save',
    editOffsetAria: 'Edit {{prayer}} Azan offset',
    customized: '✦ Customized',
    draft: '● Draft',
  },
  adhanPeriods: {
    title: 'Periods',
    add: '+ Add period',
    emptyTitle: 'No periods yet.',
    emptyHint:
      'Periods let you apply different settings for a date range, like Ramadan or summer months.',
    edit: 'Edit',
    delete: 'Delete',
    editAria: 'Edit period {{label}}',
    deleteAria: 'Delete period {{label}}',
    deleteConfirm: 'Delete period "{{label}}"? This cannot be undone.',
    statusActive: 'Active',
    statusUpcoming: 'Upcoming',
    statusPast: 'Past',
    noChanges: 'No changes',
    methodSummary: 'Method: {{method}}',
    highLatSummary: 'High lat: {{method}}',
    deleteFailed: 'Failed to delete period',
  },
  adhanPeriodForm: {
    editTitle: 'Edit period',
    newTitle: 'New period',
    name: 'Period name',
    namePlaceholder: 'e.g. Ramadan 1447',
    startDate: 'Start date',
    endDate: 'End date',
    offsets: 'Prayer offsets (minutes)',
    min: 'min',
    saveChanges: 'Save changes',
    create: 'Create period',
    failed: 'Failed to save period',
  },
  adhanGeneral: {
    title: 'General settings',
    close: 'Close drawer',
    calculationMethod: 'Calculation method',
    fajrAngle: 'Fajr angle (°)',
    ishaAngle: 'Isha angle (°)',
    anglesRange: 'Angles must be between 1° and 30°',
    madhab: 'Madhab (Asr timing)',
    highLatitude: 'High latitude rule',
    recommended: '(recommended)',
    recommendedForLocation: '✓ Recommended for this location',
    advanced: 'Advanced settings',
    rounding: 'Rounding',
    cancel: 'Cancel',
    addToChanges: 'Add to changes',
  },
  adhanPrayerDrawer: {
    title: '{{prayer}} · Azan offset',
    close: 'Close drawer',
    azanOffset: 'Azan offset',
    noOffset: 'No offset',
    later: '+{{n}} min later',
    earlier: '{{n}} min earlier',
    min: 'min',
    valueAria: 'Offset value: {{label}}',
    sliderAria: 'Offset slider, {{label}}',
    decrease: 'Decrease offset by 1 minute',
    increase: 'Increase offset by 1 minute',
    reset: 'Reset to 0',
    largeWarning: '⚠️ Offset above 10 min is large. Please confirm this is intentional.',
    cancel: 'Cancel',
    addToChanges: 'Add to changes',
    ruleDhuhr:
      'Iqama is fixed at 12:45 / 13:45 (DST-aware) and is not affected by the Azan offset.',
    ruleAsr:
      'Iqama follows a Friday-anchored seasonal fixed schedule (each season starts on the first Friday of its month) and is not directly affected by the Azan offset.',
  },
  adhanReview: {
    title: 'Review changes',
    proposed: 'Proposed:',
    setting: 'Setting',
    before: 'Before',
    after: 'After',
    loadingPreview: 'Loading preview…',
    noChanges: 'No changes detected.',
    warnings: 'Warnings',
    understand: 'I understand this will change the prayer times shown to the community.',
    understandAria: 'I understand this changes times shown to the community',
    cancel: 'Cancel',
    apply: 'Apply to public schedule',
    calculationMethod: 'Calculation method',
    madhab: 'Madhab',
    highLatitude: 'High latitude rule',
    rounding: 'Rounding',
    prayerOffset: '{{prayer}} offset',
    shafaq: 'Shafaq: {{value}}',
  },
  methods: {
    NorthAmerica: 'ISNA (North America)',
    MuslimWorldLeague: 'Muslim World League',
    Egyptian: 'Egyptian General Survey',
    Karachi: 'Karachi (Pakistan)',
    UmmAlQura: 'Umm al-Qura (Makkah)',
    Dubai: 'Dubai',
    MoonsightingCommittee: 'Moonsighting Committee',
    Kuwait: 'Kuwait',
    Qatar: 'Qatar',
    Singapore: 'Singapore (MUIS)',
    Tehran: 'Tehran',
    Turkey: 'Turkey (Diyanet)',
    Other: 'Custom',
  },
  highLat: {
    MiddleOfTheNight: 'Middle of the night',
    SeventhOfTheNight: 'Seventh of the night',
    TwilightAngle: 'Twilight angle',
  },
  madhabLabels: {
    shafi: "Shafi'i (earlier Asr)",
    hanafi: 'Hanafi (later Asr)',
  },
  roundingLabels: {
    Nearest: 'Round to nearest minute',
    Up: 'Always round up',
    None: 'No rounding',
  },
  shafaqLabels: {
    General: 'General',
    Ahmer: 'Ahmer (red twilight)',
    Abyad: 'Abyad (white twilight)',
  },
  ruleEditor: {
    choose: 'Choose…',
    remove: 'Remove',
    add: '+ Add',
    removeAria: 'Remove {{label}} {{index}}',
    itemAria: '{{label}} {{index}}',
    range: '{{min}} to {{max}}',
    sheetTitle: '{{prayer}} · Iqama rule',
    ruleType: 'Rule type',
    modifiers: 'Modifiers',
    next7Days: 'Next 7 days (Azan → Iqama)',
    loadingPreview: 'Loading preview…',
    adjusted: '⚠ Adjusted',
    movedBySafety: 'Moved by safety rules',
    fillRed: 'Fill in the fields marked in red',
    iqamaRule: 'Iqama rule',
    close: 'Close',
    cancel: 'Cancel',
    addToChanges: 'Add to changes',
  },
  ruleDescribe: {
    min: 'min',
    atAzan: 'At Azan',
    azan: 'Azan {{offset}}',
    fixed: 'Fixed at {{time}}',
    scaled: 'Gap after Azan scales from {{min}} to {{max}} min',
    seasonal_one: 'Seasonal fixed times ({{count}} period)',
    seasonal_other: 'Seasonal fixed times ({{count}} periods)',
    roundUp: 'rounded up to the next {{step}}',
    roundDown: 'rounded down to the previous {{step}}',
    roundNearest: 'rounded to the nearest {{step}}',
    minAfterAzan: 'at least {{n}} min after Azan',
    minBeforeSunrise: 'at least {{n}} min before sunrise',
    weeklyLock: 'held Friday to Thursday',
  },
  events: {
    newYear: '🗓️ Hijri New Year',
    ashura: '🤲 Day of Ashura',
    isra: "🕌 Isra' and Mi'raj",
    ramadan: '🌙 Ramadan Mubarak',
    eidFitr: '🌙 Eid al-Fitr Mubarak',
    hajj: '🕋 Hajj Season',
    arafah: '🤲 Day of Arafah',
    eidAdha: '🐑 Eid al-Adha Mubarak',
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
      changesOn_one: 'Changes on {{count}} day',
      changesOn_other: 'Changes on {{count}} days',
      newlyMovedWarning_one: '⚠ {{count}} day will be moved by safety rules',
      newlyMovedWarning_other: '⚠ {{count}} days will be moved by safety rules',
      conflictTitle_one: 'Fajr will be too close to sunrise on {{count}} day',
      conflictTitle_other: 'Fajr will be too close to sunrise on {{count}} days',
      conflictListed: '(first {{m}} listed)',
      conflictLine: '{{date}}: iqama {{iqama}}, sunrise {{sunrise}}',
      understandLabel: 'I understand this will change the prayer times shown to the community.',
      understandAria: 'I understand this changes times shown to the community',
      staleNotice:
        'The rules changed on the engine since you opened this page. Reload to see the latest rules. Your edits are kept and applied on top of them.',
      reloadLatest: 'Reload latest rules',
      details: 'Details',
      daysChanged_one: '{{count}} day changed (of {{total}})',
      daysChanged_other: '{{count}} days changed (of {{total}})',
      daysMoved_one: '{{count}} day moved by safety rules',
      daysMoved_other: '{{count}} days moved by safety rules',
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
