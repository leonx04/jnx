'use client'

import { useEffect } from 'react'

export default function TawkChat() {
    useEffect(() => {
        // Initialize Tawk.to script
        var Tawk_API = (window.Tawk_API = window.Tawk_API || {})
        var Tawk_LoadStart = new Date()

        const s1 = document.createElement('script')
        const s0 = document.getElementsByTagName('script')[0]

        s1.async = true
        s1.src = 'https://embed.tawk.to/676908b1af5bfec1dbe06f09/1ifp4jua4'
        s1.charset = 'UTF-8'
        s1.setAttribute('crossorigin', '*')

        s0.parentNode?.insertBefore(s1, s0)

        // Cleanup function
        return () => {
            // Remove the script when component unmounts
            const tawkScript = document.querySelector('script[src*="tawk.to"]')
            if (tawkScript) {
                tawkScript.remove()
            }
        }
    }, [])

    return null
}

