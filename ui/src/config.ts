export const DEBUG_ENABLED =
  import.meta.env.DEV || localStorage.getItem('debugEnabled') == '1';
