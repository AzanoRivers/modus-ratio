import { defineMiddleware } from 'astro:middleware'
import { getLocale } from '@/utils/getLocale'
import { getIP } from '@/lib/getIP'
import { isBanned } from '@/lib/rateLimit'

const BAN_CHECK_EXCLUDED = ['/429', '/_astro', '/favicon']

function isExcluded(pathname: string): boolean {
  return BAN_CHECK_EXCLUDED.some(prefix => pathname.startsWith(prefix))
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.language = getLocale(context.request)

  if (!isExcluded(context.url.pathname)) {
    const ip = getIP(context.request)
    if (await isBanned(ip)) {
      return context.redirect('/429', 302)
    }
  }

  return next()
})
