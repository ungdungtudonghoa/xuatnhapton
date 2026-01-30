'use client'

import { useEffect, useState } from 'react'

const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key'

export function useGeminiKey() {
    const [apiKey, setApiKeyState] = useState<string | null>(null)
    const [hasApiKey, setHasApiKey] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load API key from localStorage on mount
        const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)
        if (stored) {
            setApiKeyState(stored)
            setHasApiKey(true)
        }
        setLoading(false)
    }, [])

    const setApiKey = (key: string) => {
        try {
            localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key)
            setApiKeyState(key)
            setHasApiKey(true)
        } catch (error) {
            console.error('Error saving API key:', error)
            throw error
        }
    }

    const clearApiKey = () => {
        try {
            localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY)
            setApiKeyState(null)
            setHasApiKey(false)
        } catch (error) {
            console.error('Error clearing API key:', error)
            throw error
        }
    }

    const getMaskedKey = () => {
        if (!apiKey) return null
        if (apiKey.length <= 8) return '***'
        return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    }

    return {
        apiKey,
        hasApiKey,
        loading,
        setApiKey,
        clearApiKey,
        getMaskedKey,
    }
}
