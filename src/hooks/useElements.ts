import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const useElementOnScreen = (options?: { root: Element | Document | null; rootMargin: string; threshold: number }) => {
  const containerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const defaultOptions = useMemo(
    () => ({
      root: null,
      rootMargin: '0px 0px 0px 0px',
      threshold: 1,
    }),
    [],
  )
  const callbackFunction = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry) {
      setIsVisible(entry.isIntersecting)
    }
  }, [])

  useEffect(() => {
    const observerOptions = options ?? defaultOptions
    const observer = new IntersectionObserver(callbackFunction, observerOptions)

    if (containerRef.current) observer.observe(containerRef.current!)
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current!)
    }
  }, [callbackFunction, defaultOptions, options])

  return {
    containerRef,
    isVisible,
  }
}

export default useElementOnScreen
