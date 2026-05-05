// Type shim for dayjs-hijri plugin (no bundled types)
declare module 'dayjs-hijri' {
  import type { PluginFunc } from 'dayjs';
  const plugin: PluginFunc;
  export default plugin;
}

// Augment the Dayjs instance with the .calendar() method added by the plugin
declare module 'dayjs' {
  interface Dayjs {
    /** Switch this instance to the given calendar system. */
    calendar(type: 'hijri' | 'gregory'): Dayjs;
  }
}
