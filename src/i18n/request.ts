import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  const [common, superadmin] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/superadmin/${locale}.json`),
  ])

  return {
    locale,
    messages: {
      ...common.default,
      superadmin: superadmin.default,
    },
  }
})