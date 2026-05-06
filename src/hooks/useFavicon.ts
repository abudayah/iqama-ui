import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const VERSION = '?v=20260506';

export function useFavicon() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    const prefix = isAdmin ? '/favicon-admin' : '/favicon';
    const appTitle = isAdmin ? 'Admin' : 'Iqama';

    const favicon96 = document.getElementById('favicon-96') as HTMLLinkElement | null;
    const faviconSvg = document.getElementById('favicon-svg') as HTMLLinkElement | null;
    const appleTouchIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
    const manifest = document.getElementById('manifest') as HTMLLinkElement | null;
    const appTitleMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]',
    );

    if (favicon96) favicon96.href = `${prefix}/favicon-96x96.png${VERSION}`;
    if (faviconSvg) faviconSvg.href = `${prefix}/favicon.svg${VERSION}`;
    if (appleTouchIcon) appleTouchIcon.href = `${prefix}/apple-touch-icon.png${VERSION}`;
    if (manifest) manifest.href = `${prefix}/site.webmanifest${VERSION}`;
    if (appTitleMeta) appTitleMeta.content = appTitle;
  }, [isAdmin]);
}
