export async function onRequest(context) {
  const url = new URL(context.request.url);

  // When accessed via card.kenthephotographer.com, seamlessly map to the /card/ build
  if (url.hostname === 'card.kenthephotographer.com') {
    if (url.pathname === '/' || url.pathname === '') {
      return context.env.ASSETS.fetch(new URL('/card/index.html', url));
    }
    if (!url.pathname.startsWith('/card/')) {
      return context.env.ASSETS.fetch(new URL(`/card${url.pathname}${url.search}`, url));
    }
  }

  return context.next();
}
