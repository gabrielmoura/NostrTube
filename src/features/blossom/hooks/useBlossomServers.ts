import { useMemo } from 'react'
import { normalizeBlossomServerUrl } from '@/features/upload/services/blossom-server.service'
import useUserStore from '@/store/useUserStore'
import { BLOSSOM_DEFAULT_PRIMARY_SERVER, BLOSSOM_DEFAULT_SERVERS } from '../blossom.defaults'
import { isValidBlossomUrl } from '../blossom.utils'

export function useBlossomServers() {
  const defaultServer = useUserStore((state) => state.blossom.default)
  const mirrors = useUserStore((state) => state.blossom.mirrors)
  const custom = useUserStore((state) => state.blossom.custom)
  const hasUserConfiguration = Boolean(defaultServer || mirrors.length > 0 || custom.length > 0)
  const effectiveDefaultServer = normalizeBlossomServerUrl(defaultServer || BLOSSOM_DEFAULT_PRIMARY_SERVER)

  const localServers = useMemo(() => {
    const userServers = [defaultServer, ...mirrors, ...custom]
      .map((url) => normalizeBlossomServerUrl(url))
      .filter(isValidBlossomUrl)

    if (userServers.length > 0) {
      return Array.from(new Set(userServers))
    }

    return Array.from(
      new Set(BLOSSOM_DEFAULT_SERVERS.map((server) => normalizeBlossomServerUrl(server.url)).filter(isValidBlossomUrl)),
    )
  }, [custom, defaultServer, mirrors])

  return {
    localServers,
    hasUserConfiguration,
    defaultServer: effectiveDefaultServer,
    mirrors,
  }
}
