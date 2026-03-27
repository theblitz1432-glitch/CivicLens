'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Mic, MicOff, X, Loader2, Volume2, RefreshCw, Camera, ChevronDown, Globe } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Message { role: 'user' | 'assistant'; text: string; lang: string }
type FlowState = 'idle' | 'complaint_category' | 'complaint_description' | 'complaint_photo' | 'complaint_confirm'
interface ComplaintData { category: string; description: string; photoTaken: boolean }

declare global {
  interface Window {
    __civicSetTab?: (tab: string) => void
    __civicGetProjects?: () => any[]
    __civicGetComplaints?: () => any[]
    __civicGetStats?: () => any
    __civicShowProjects?: () => void
    __civicSetCategory?: (cat: string) => void
    __civicSetDescription?: (desc: string) => void
  }
}

// ── Language config ──────────────────────────────────────────────────────────
const LANGS = [
  { code: 'en-IN', label: 'English',   hf: 'en' },
  { code: 'hi-IN', label: 'Hindi',     hf: 'hi' },
  { code: 'ta-IN', label: 'Tamil',     hf: 'ta' },
  { code: 'te-IN', label: 'Telugu',    hf: 'te' },
  { code: 'bn-IN', label: 'Bengali',   hf: 'bn' },
  { code: 'gu-IN', label: 'Gujarati',  hf: 'gu' },
  { code: 'pa-IN', label: 'Punjabi',   hf: 'pa' },
  { code: 'kn-IN', label: 'Kannada',   hf: 'kn' },
  { code: 'ml-IN', label: 'Malayalam', hf: 'ml' },
  { code: 'mr-IN', label: 'Marathi',   hf: 'mr' },
]
const getLang = (code: string) => LANGS.find(l => l.code === code) ?? LANGS[0]

// ── HuggingFace translation ──────────────────────────────────────────────────
const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN

const translateToEnglish = async (text: string, srcLang: string): Promise<string> => {
  if (srcLang === 'en' || !HF_TOKEN) return text
  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-${srcLang}-en`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
      }
    )
    if (!res.ok) return text
    const data = await res.json()
    return data?.[0]?.translation_text || text
  } catch { return text }
}

// ── LangChain-style prompt builder ───────────────────────────────────────────
const buildPrompt = (
  langLabel: string, langCode: string, flowState: FlowState,
  firstName: string, complaintData: ComplaintData,
  projects: any[], stats: any, pathname: string
) => {
  const name = firstName ? `User's name: ${firstName}. Use their name warmly.` : ''
  const projectList = projects.length > 0
    ? projects.slice(0, 5).map(p => `• ${p.title} (${p.status}, ${p.completionPercentage}%)`).join('\n')
    : 'No projects found.'

  const system = `You are CivicLens Voice AI Assistant for Hisar District, Haryana.
${name}

CRITICAL LANGUAGE RULE — HIGHEST PRIORITY:
- The user spoke in: ${langLabel} (${langCode})
- YOU MUST REPLY IN ${langLabel.toUpperCase()} ONLY
- If user spoke Hindi → reply in Hindi
- If user spoke English → reply in English
- If user spoke Tamil → reply in Tamil
- NEVER ask user to switch language
- NEVER reply in English when user spoke Hindi
- Hinglish (mixed Hindi-English) → reply in Hindi

RESPONSE RULES:
- Maximum 2-3 short sentences
- Friendly and helpful
- NEVER show control tags like [TAB:] or [CAT:] to the user`

  const flows: Record<FlowState, string> = {
    idle: `
AVAILABLE DATA:
Projects:
${projectList}
Stats: Total=${stats.total}, Resolved=${stats.resolved}, Pending=${stats.pending}

NAVIGATION INTENT — append tag at end ONLY when user explicitly asks:
- "complaint/shikayat/file/register/darj" → [TAB:complaints]
- "map/naksha/location" → [TAB:map]
- "home/dashboard/overview/ghar" → [TAB:overview]
- "profile/settings/account" → [TAB:settings]
- "analytics/updates/stats" → [TAB:analytics]
- "projects/construction/ongoing/kaam/nirman" → summarize projects in ${langLabel} then add [TAB:overview][SHOW:projects]

IMPORTANT: If user just describes a problem WITHOUT asking to register — ask them warmly if they want to file a complaint. Do NOT add [TAB:complaints] automatically.`,

    complaint_category: `
TASK: Detect complaint category from what user says.
Map to exactly one:
- road/pothole/sadak/highway/gaddha → [CAT:Road & Infrastructure]
- water/pani/supply/tap/nalkaa → [CAT:Water Supply]
- electricity/bijli/power/light/current → [CAT:Electricity]
- garbage/sanitation/safai/kachra/ganda → [CAT:Sanitation]
- drain/nali/drainage/flooding/barsat → [CAT:Drainage]
- street light/lamp post/khamba → [CAT:Street Light]
- park/garden/playground/bagicha → [CAT:Park]
- anything else → [CAT:Other]

Confirm category warmly in ${langLabel} + add [CAT:CategoryName]
DO NOT add [TAB:] or [DESC_DONE]`,

    complaint_description: `
TASK: User is describing their complaint problem.
- Accept their EXACT words as the description — do not paraphrase
- Confirm you understood in ${langLabel}
- Add [DESC_DONE] at the very end
- DO NOT add [CAT:] or [SUBMIT] or [TAB:]`,

    complaint_photo: `
TASK: Tell user to tap the green camera button below to take a photo of the problem.
Keep it very short (1 sentence). No special tags needed.`,

    complaint_confirm: `
TASK: Confirm complaint details with user.
Category: ${complaintData.category}
Description: ${complaintData.description}

Read back briefly in ${langLabel}.
If user confirms (yes/ok/haan/submit/confirm/bilkul/theek/ha) → add [SUBMIT]
If user says no/nahin/cancel → say OK and ask what to change.`,
  }

  return { system, instruction: flows[flowState] ?? flows.idle }
}

// ── Groq LLM call ────────────────────────────────────────────────────────────
const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY

const callGroq = async (
  userMsg: string, history: Message[],
  system: string, instruction: string
): Promise<string> => {
  if (!GROQ_KEY) throw new Error('Missing NEXT_PUBLIC_GROQ_API_KEY in .env.local')
  const histMsgs = history.slice(-8).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text,
  }))
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `${system}\n\n${instruction}` },
        ...histMsgs,
        { role: 'user', content: userMsg },
      ],
      max_tokens: 200,
      temperature: 0.1, // very low = strict language compliance
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? 'Please try again.'
}

// ── Language detection ───────────────────────────────────────────────────────
const detectScript = (text: string): string | null => {
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'  // Devanagari → Hindi
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN'  // Gurmukhi → Punjabi
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'  // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'  // Telugu
  if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'  // Bengali
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'  // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'  // Malayalam
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'  // Gujarati
  return null
}

// Pure Hindi Roman words — if 1+ found, it's Hinglish → reply in Hindi
// These words CANNOT be English words
const HINDI_ROMAN = new Set([
  'mujhe','muje','mere','mera','meri','tumhe','main','hum','aap','wo','yeh',
  'karo','karni','karna','karein','chahiye','chahie','batao','sunao',
  'hai','hain','tha','thi','the','hoga','hogi','nahi','nahin','nai','mat',
  'aur','ya','lekin','toh','bhi','bahut','thoda','zyada','sab','kuch',
  'bilkul','kya','kyun','kaise','kahan','kaun','kitna','kab',
  'shikayat','darj','pani','bijli','sadak','safai','abhi','aaj','kal',
  'yahan','wahan','ghar','haan','theek','achha','zyada','bahut',
  'bijli','nali','kachra','sadak','gaddha',
])

// Returns true if text has ANY Hindi roman word (even 1 = Hinglish)
const isHinglish = (t: string): boolean =>
  t.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).some(w => HINDI_ROMAN.has(w))

// Main language resolver — uses recognition lang as primary source of truth
const resolveLang = (transcript: string, recognitionLang: string): string => {
  // 1. Script detection is most accurate
  const script = detectScript(transcript)
  if (script) return script

  // 2. Hinglish detection (Roman Hindi words)
  if (isHinglish(transcript)) return 'hi-IN'

  // 3. Fall back to whatever language the mic was set to
  return recognitionLang
}

const PHOTO_PROMPTS: Record<string, string> = {
  'en-IN': 'Please tap the green camera button below to take a photo of the issue.',
  'hi-IN': 'Neeche hare camera button ko tap karein aur samasya ki photo lein.',
  'ta-IN': 'Piracchanaiyin patam edukka padathai tappaveyyungal.',
  'te-IN': 'Dayachesi camera button ni tap cheyandi photo teeyandiki.',
  'bn-IN': 'Camera button e tap korun chhabi tolar jonyo.',
  'gu-IN': 'Camera button tapo ane samasyano photo lo.',
  'pa-IN': 'Camera button te tap karo samasya di photo lain layi.',
  'kn-IN': 'Camera button tap madi samasye foto tegeyiri.',
  'ml-IN': 'Prashnathinte photo edukkaan camera button tap cheyyu.',
  'mr-IN': 'Samasyeche photo ghenyasathi camera button tap kara.',
}

const THINKING: Record<string, string> = {
  'en-IN': 'Thinking...', 'hi-IN': 'Soch raha hun...', 'ta-IN': 'Yosikkiren...',
  'te-IN': 'Aalochistunnanu...', 'bn-IN': 'Vabchi...', 'gu-IN': 'Vichari rahyo...',
  'pa-IN': 'Soch reha han...', 'kn-IN': 'Yochisuttiddene...', 'ml-IN': 'Chintikkunnu...', 'mr-IN': 'Vichar karto...',
}

const GREETINGS: Record<string, (name: string) => string> = {
  'en-IN': n => n ? `Hello ${n}! I'm CivicLens AI. How can I help?` : "Hello! I'm CivicLens AI. How can I help you today?",
  'hi-IN': n => n ? `Namaste ${n} ji! Kya madad chahiye?` : 'Namaste! Main CivicLens AI hun. Kya madad chahiye?',
  'pa-IN': n => n ? `Sat Sri Akal ${n} ji!` : 'Sat Sri Akal! Main CivicLens AI han.',
  'ta-IN': n => n ? `Vanakkam ${n}!` : 'Vanakkam! Naan CivicLens AI.',
  'te-IN': n => n ? `Namaskaram ${n}!` : 'Namaskaram! Nenu CivicLens AI.',
  'bn-IN': n => n ? `Nomoshkar ${n}!` : 'Nomoshkar! Ami CivicLens AI.',
  'gu-IN': n => n ? `Kem cho ${n}!` : 'Kem cho! Hu CivicLens AI chhu.',
  'kn-IN': n => n ? `Namaskara ${n}!` : 'Namaskara! Naanu CivicLens AI.',
  'ml-IN': n => n ? `Namaskaram ${n}!` : 'Namaskaram! Njan CivicLens AI anu.',
  'mr-IN': n => n ? `Namaskar ${n}!` : 'Namaskar! Mi CivicLens AI aahe.',
}

// Safe first-name extractor — skips common non-name words like "The"
const SKIP_NAMES = new Set(['the','a','an','guest','user','null','undefined','admin','test','na','unknown'])
const getFirstName = (name?: string | null): string => {
  if (!name || typeof name !== 'string') return ''
  const first = name.trim().split(/\s+/)[0]
  if (!first || SKIP_NAMES.has(first.toLowerCase())) return ''
  // Only return if it looks like a real name (has letters, not all numbers)
  return /[a-zA-Z\u0900-\u097F]/.test(first) ? first : ''
}

// ── Set React state from outside component ───────────────────────────────────
const setComplaintField = (field: 'category' | 'description', value: string): boolean => {
  // Method 1: Global bridge (most reliable)
  if (field === 'category' && window.__civicSetCategory) {
    window.__civicSetCategory(value)
    return true
  }
  if (field === 'description' && window.__civicSetDescription) {
    window.__civicSetDescription(value)
    return true
  }
  // Method 2: React fiber / native setter fallback
  const ids = { category: 'complaint-category', description: 'complaint-description' }
  const el = document.getElementById(ids[field]) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  if (!el) return false
  try {
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (setter) { setter.call(el, value) } else { el.value = value }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  } catch { return false }
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function VoiceAgent() {
  const [isOpen,         setIsOpen]         = useState(false)
  const [isListening,    setIsListening]    = useState(false)
  const [isSpeaking,     setIsSpeaking]     = useState(false)
  const [isThinking,     setIsThinking]     = useState(false)
  const [autoListen,     setAutoListen]     = useState(false)
  const [showChat,       setShowChat]       = useState(true)
  const [messages,       setMessages]       = useState<Message[]>([])
  const [transcript,     setTranscript]     = useState('')
  const [statusText,     setStatusText]     = useState('Tap mic to speak')
  const [selectedLang,   setSelectedLang]   = useState('en-IN')
  const [activeLang,     setActiveLang]     = useState('en-IN')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [flowState,      setFlowState]      = useState<FlowState>('idle')
  const [complaintData,  setComplaintData]  = useState<ComplaintData>({ category: '', description: '', photoTaken: false })
  const [error,          setError]          = useState<string | null>(null)
  const [showPhotoBtn,   setShowPhotoBtn]   = useState(false)
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null)
  const [translating,    setTranslating]    = useState(false)

  const recogRef       = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const voicesRef      = useRef<SpeechSynthesisVoice[]>([])
  const photoInputRef  = useRef<HTMLInputElement>(null)

  // Stable refs — avoid stale closures in callbacks
  const r = {
    selectedLang: useRef('en-IN'),
    activeLang:   useRef('en-IN'),
    isSpeaking:   useRef(false),
    isThinking:   useRef(false),
    autoListen:   useRef(false),
    flowState:    useRef<FlowState>('idle'),
    startMic:     useRef<() => void>(() => {}),
    // Accumulate partial transcripts on mobile
    partialBuffer: useRef(''),
    lastResultTime: useRef(Date.now()),
  }

  useEffect(() => { r.selectedLang.current = selectedLang }, [selectedLang])
  useEffect(() => { r.activeLang.current   = activeLang   }, [activeLang])
  useEffect(() => { r.isSpeaking.current   = isSpeaking   }, [isSpeaking])
  useEffect(() => { r.isThinking.current   = isThinking   }, [isThinking])
  useEffect(() => { r.autoListen.current   = autoListen   }, [autoListen])
  useEffect(() => { r.flowState.current    = flowState    }, [flowState])

  useEffect(() => {
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices() }
    load(); window.speechSynthesis.onvoiceschanged = load
  }, [])

  useEffect(() => {
    if (showChat) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showChat])

  // Stop mic when entering photo step
  useEffect(() => {
    if (flowState === 'complaint_photo' && recogRef.current) {
      try { recogRef.current.stop() } catch {}
      recogRef.current = null
      setIsListening(false)
    }
  }, [flowState])

  const router   = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, lang: string) => {
    window.speechSynthesis.cancel()
    const clean = text.replace(/\[.*?\]/g, '').trim()
    if (!clean) return
    const utt   = new SpeechSynthesisUtterance(clean)
    utt.lang    = lang; utt.rate = 0.92; utt.pitch = 1.05
    utt.voice   =
      voicesRef.current.find(v => v.lang === lang && v.name.includes('Google')) ??
      voicesRef.current.find(v => v.lang === lang) ??
      voicesRef.current.find(v => v.lang.startsWith(lang.split('-')[0])) ?? null
    utt.onstart = () => { setIsSpeaking(true); setStatusText('Speaking...') }
    utt.onend   = () => {
      setIsSpeaking(false)
      setStatusText(r.autoListen.current ? 'Listening...' : 'Tap mic to speak')
      if (r.autoListen.current && !r.isThinking.current && !recogRef.current)
        setTimeout(() => r.startMic.current(), 1200)
      if (r.flowState.current === 'complaint_photo' && photoInputRef.current)
        setTimeout(() => { try { photoInputRef.current?.click() } catch {} }, 600)
    }
    utt.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utt)
  }, [])

  // ── Photo handler ────────────────────────────────────────────────────────
  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    setComplaintData(p => ({ ...p, photoTaken: true }))
    setShowPhotoBtn(false)
    setFlowState('complaint_confirm')
    const lang = r.activeLang.current
    const msg  = lang === 'en-IN'
      ? 'Photo added! Say "yes" or "submit" to file your complaint.'
      : 'Photo jod di! "Haan" ya "submit" bolein complaint darj karne ke liye.'
    setMessages(p => [...p, { role: 'assistant', text: msg, lang }])
    speak(msg, lang)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }, [speak])

  // ── Handle AI response tags ──────────────────────────────────────────────
  const handleResponse = useCallback((reply: string, userMsg: string, lang: string) => {
    // Navigation — only in idle flow
    const tabM = reply.match(/\[TAB:(.*?)\]/)
    if (tabM && r.flowState.current === 'idle') {
      const tab = tabM[1].trim()
      setTimeout(() => {
        if (window.__civicSetTab) window.__civicSetTab(tab)
        else router.push(`/citizen?tab=${tab}`)
      }, 1200)
      if (tab === 'complaints') {
        setFlowState('complaint_category')
        setComplaintData({ category: '', description: '', photoTaken: false })
      }
    }

    // Show projects modal
    if (reply.includes('[SHOW:projects]'))
      setTimeout(() => window.__civicShowProjects?.(), 1600)

    // Category detected
    const catM = reply.match(/\[CAT:(.*?)\]/)
    if (catM) {
      const cat = catM[1].trim()
      setComplaintData(p => ({ ...p, category: cat }))
      setComplaintField('category', cat)
      console.log('[Voice] Category:', cat)
      setFlowState('complaint_description')
      return
    }

    // Description confirmed — use ORIGINAL user speech (not translated)
    if (reply.includes('[DESC_DONE]')) {
      const desc = userMsg.trim()
      setComplaintData(p => ({ ...p, description: desc }))
      setComplaintField('description', desc)
      console.log('[Voice] Description:', desc)
      setFlowState('complaint_photo')
      setShowPhotoBtn(true)
      const photoMsg = PHOTO_PROMPTS[lang] ?? PHOTO_PROMPTS['en-IN']
      setTimeout(() => {
        setMessages(p => [...p, { role: 'assistant', text: photoMsg, lang }])
        speak(photoMsg, lang)
      }, 400)
      return
    }

    // Submit
    if (reply.includes('[SUBMIT]')) {
      const yes = ['yes','ok','okay','sure','submit','haan','ha','bilkul','zaroor','yeah','confirm','theek']
      if (yes.some(w => userMsg.toLowerCase().includes(w))) {
        document.getElementById('complaint-submit')?.click()
        setFlowState('idle'); setShowPhotoBtn(false); setPhotoPreview(null)
      }
    }
  }, [router, speak])

  // ── Main AI pipeline ─────────────────────────────────────────────────────
  const askAI = useCallback(async (userMsg: string, recognitionLang: string) => {
    // Smart language resolution — recognition lang + script detection + hinglish
    const lang     = resolveLang(userMsg, recognitionLang)
    const langInfo = getLang(lang)

    setActiveLang(lang)
    setIsThinking(true)
    setStatusText('Thinking...')
    setError(null)

    const newHistory: Message[] = [...messages, { role: 'user', text: userMsg, lang }]
    setMessages(newHistory)

    try {
      // HuggingFace: translate non-English to English for LLM understanding
      let llmMsg = userMsg
      if (lang !== 'en-IN' && langInfo.hf !== 'en' && HF_TOKEN) {
        setTranslating(true)
        llmMsg = await translateToEnglish(userMsg, langInfo.hf)
        setTranslating(false)
        console.log('[HF translate]', userMsg, '→', llmMsg)
      }

      // LangChain-style prompt with language explicitly stated
      const appData = {
        projects:   window.__civicGetProjects?.()   ?? [],
        complaints: window.__civicGetComplaints?.() ?? [],
        stats:      window.__civicGetStats?.()      ?? { total: 0, resolved: 0, pending: 0 },
      }
      const { system, instruction } = buildPrompt(
        langInfo.label, lang, r.flowState.current,
        getFirstName(user?.name), complaintData,
        appData.projects, appData.stats, pathname
      )

      const reply = await callGroq(llmMsg, newHistory, system, instruction)
      console.log('[AI lang:', lang, '] reply:', reply)

      const clean = reply.replace(/\[.*?\]/g, '').trim()
      setMessages(p => [...p, { role: 'assistant', text: clean || reply, lang }])
      speak(reply, lang)
      // Always pass ORIGINAL message for description storage
      handleResponse(reply, userMsg, lang)

    } catch (err: any) {
      const isKey = err.message?.includes('401') || err.message?.includes('403')
      setError(isKey ? 'Invalid Groq API key' : 'Connection error — try again')
      speak('Something went wrong, please try again.', lang)
    } finally {
      setIsThinking(false)
      setTranslating(false)
    }
  }, [messages, speak, handleResponse, complaintData, pathname, user])

  // ── Speech Recognition — Mobile-optimized ───────────────────────────────
  // ROOT CAUSE OF "I want" / "Mujhe" partial speech:
  // On Android, SpeechRecognition fires 'end' after ~5-7s of silence OR after
  // first pause. We fix this by:
  // 1. Accumulating interim results in a buffer
  // 2. Using a silence detector — only submit after 2s of no new words
  // 3. If recognition ends without final result, use the buffer
  const startMic = useCallback(() => {
    if (r.isSpeaking.current || r.isThinking.current) return
    if (recogRef.current) {
      try { recogRef.current.abort() } catch {}
      recogRef.current = null
    }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { setError('Use Chrome or Edge for voice input'); return }

    const rec = new SR()
    recogRef.current = rec

    // Mobile settings — key fix for partial speech
    rec.continuous     = true   // keep listening even after pauses
    rec.interimResults = true   // get partial results
    rec.maxAlternatives = 1
    rec.lang           = r.selectedLang.current

    let bestTranscript   = ''   // accumulates the best final/interim text
    let silenceTimer: ReturnType<typeof setTimeout> | null = null
    let hasResult        = false

    // Submit what we have after silence
    const submitCurrent = () => {
      if (!bestTranscript.trim()) return
      const text = bestTranscript.trim()
      bestTranscript = ''
      hasResult = true
      recogRef.current = null
      try { rec.stop() } catch {}
      askAI(text, r.selectedLang.current)
    }

    // Reset silence timer on each new word
    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      // Wait 2.5s of silence before submitting — gives user time to pause between words
      silenceTimer = setTimeout(submitCurrent, 2500)
    }

    rec.onstart = () => {
      setIsListening(true)
      setStatusText('Listening...')
      hasResult    = false
      bestTranscript = ''
      r.partialBuffer.current = ''
    }

    rec.onresult = (e: any) => {
      // Build transcript from ALL results (not just latest)
      let interimText = ''
      let finalText   = ''

      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + ' '
        } else {
          interimText += result[0].transcript
        }
      }

      const combined = (finalText + interimText).trim()
      if (combined) {
        bestTranscript = combined
        setTranscript(combined)
        r.lastResultTime.current = Date.now()
        resetSilenceTimer()
      }
    }

    rec.onerror = (e: any) => {
      if (silenceTimer) clearTimeout(silenceTimer)
      recogRef.current = null
      setIsListening(false)
      setTranscript('')

      if (e.error === 'not-allowed') {
        setError('Microphone permission denied')
        return
      }

      // no-speech / audio-capture — restart in auto mode
      if ((e.error === 'no-speech' || e.error === 'audio-capture') && r.autoListen.current) {
        setTimeout(() => { if (r.autoListen.current && !r.isSpeaking.current) r.startMic.current() }, 500)
      }
    }

    rec.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      recogRef.current = null
      setIsListening(false)

      // If we have buffered text and didn't already submit, submit it now
      // This handles the case where Android kills recognition mid-sentence
      if (bestTranscript.trim() && !hasResult && !r.isThinking.current) {
        console.log('[Mic] Submitting buffered text on end:', bestTranscript)
        const text = bestTranscript.trim()
        bestTranscript = ''
        setTranscript('')
        askAI(text, r.selectedLang.current)
        return
      }

      setTranscript('')

      if (hasResult) {
        // Submitted — wait for AI then restart in auto mode
        setStatusText(r.autoListen.current ? 'Processing...' : 'Tap mic to speak')
        return
      }

      // No speech detected
      if (r.autoListen.current && !r.isSpeaking.current && !r.isThinking.current) {
        setTimeout(() => {
          if (r.autoListen.current && !r.isSpeaking.current && !r.isThinking.current)
            r.startMic.current()
        }, 500)
      } else {
        setStatusText('Tap mic to speak')
      }
    }

    try { rec.start() } catch { recogRef.current = null }
  }, [askAI])

  useEffect(() => { r.startMic.current = startMic }, [startMic])

  const stopMic = useCallback(() => {
    if (recogRef.current) {
      try { recogRef.current.stop() } catch {}
      try { recogRef.current.abort() } catch {}
      recogRef.current = null
    }
    setIsListening(false); setTranscript(''); setStatusText('Tap mic to speak')
  }, [])

  const toggleAutoListen = () => {
    setAutoListen(prev => {
      if (prev) { stopMic(); setShowChat(true); return false }
      setShowChat(false)
      setTimeout(() => r.startMic.current(), 300)
      return true
    })
  }

  const changeLang = (code: string) => {
    setSelectedLang(code); setActiveLang(code); setShowLangPicker(false)
    if (isListening) { stopMic(); setTimeout(() => startMic(), 300) }
  }

  const resetChat = () => {
    setMessages([]); setFlowState('idle'); setShowPhotoBtn(false)
    setPhotoPreview(null); setError(null)
    setComplaintData({ category: '', description: '', photoTaken: false })
  }

  const handleClose = () => {
    stopMic(); window.speechSynthesis.cancel(); setAutoListen(false)
    setIsOpen(false); resetChat(); setShowChat(true)
  }

  // Greeting on open
  useEffect(() => {
    if (!isOpen || messages.length > 0) return
    const fn = getFirstName(user?.name)
    const greeting = (GREETINGS[selectedLang] ?? GREETINGS['en-IN'])(fn)
    setTimeout(() => {
      setMessages([{ role: 'assistant', text: greeting, lang: selectedLang }])
      speak(greeting, selectedLang)
    }, 600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedLang])

  // ── Derived ──────────────────────────────────────────────────────────────
  const firstName  = getFirstName(user?.name)
  const langDisp   = getLang(selectedLang)
  const activeDisp = getLang(activeLang)
  const headerBg   = isListening ? 'bg-red-600'
    : isSpeaking  ? 'bg-emerald-600'
    : isThinking  ? 'bg-amber-600'
    : 'bg-indigo-600'

  const FLOW_LABELS: Record<FlowState, string> = {
    idle: '',
    complaint_category:    '📋 Step 1: Tell category',
    complaint_description: '📝 Step 2: Describe issue',
    complaint_photo:       '📷 Step 3: Take photo',
    complaint_confirm:     '✅ Step 4: Confirm & submit',
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)}
      className="fixed bottom-24 left-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-all active:scale-95">
      <Mic className="w-6 h-6" />
    </button>
  )

  // Hands-free floating bar
  if (autoListen && !showChat) return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-md rounded-full border border-white/10 shadow-2xl max-w-xs w-full">
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        isListening ? 'bg-red-400 animate-pulse'
        : isSpeaking ? 'bg-emerald-400 animate-pulse'
        : isThinking ? 'bg-amber-400 animate-pulse'
        : 'bg-slate-500'
      }`} />
      <span className="text-white/80 text-xs truncate flex-1">
        {transcript || (isThinking ? (THINKING[activeLang] ?? 'Thinking...') : statusText)}
      </span>
      <span className="text-white/40 text-[10px] shrink-0">{activeDisp.label}</span>
      <button onClick={isListening ? stopMic : startMic} disabled={isThinking || isSpeaking}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isListening ? 'bg-red-500' : 'bg-indigo-500'} disabled:opacity-40`}>
        {isListening ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-white" />}
      </button>
      <button onClick={() => setShowChat(true)} className="text-white/50 hover:text-white text-xs border border-white/20 px-2 py-1 rounded-full shrink-0">chat</button>
      <button onClick={() => { setAutoListen(false); setShowChat(true); stopMic() }} className="text-white/40 hover:text-white shrink-0"><X className="w-4 h-4" /></button>
    </div>
  )

  // Full chat panel
  return (
    <div className="fixed bottom-24 left-6 z-50 w-80 bg-[#0d1117] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>

      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${headerBg} transition-colors duration-300 shrink-0`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            {isListening ? <MicOff className="w-4 h-4 text-white" />
              : isSpeaking ? <Volume2 className="w-4 h-4 text-white" />
              : isThinking ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Mic className="w-4 h-4 text-white" />}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              CivicLens AI{firstName ? ` · ${firstName}` : ''}
            </p>
            <p className="text-white/70 text-xs">{translating ? '🌐 Translating...' : statusText}</p>
          </div>
        </div>
        <button onClick={handleClose} className="text-white/80 hover:text-white ml-2 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Flow step indicator */}
      {flowState !== 'idle' && (
        <div className="bg-indigo-900/40 px-4 py-1.5 text-xs text-indigo-300 font-medium border-b border-indigo-800/40 shrink-0">
          {FLOW_LABELS[flowState]}
        </div>
      )}

      {/* Language selector */}
      <div className="relative bg-slate-900 border-b border-slate-800 shrink-0">
        <button onClick={() => setShowLangPicker(p => !p)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">
              Speak: <span className="text-indigo-400 font-medium">{langDisp.label}</span>
              {activeLang !== selectedLang && (
                <span className="text-emerald-400 ml-2">· AI replied in: {activeDisp.label}</span>
              )}
            </span>
            {HF_TOKEN && <span className="text-purple-400 text-[10px] bg-purple-900/30 px-1.5 py-0.5 rounded-full ml-1">HF</span>}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLangPicker ? 'rotate-180' : ''}`} />
        </button>
        {showLangPicker && (
          <div className="absolute top-full left-0 right-0 z-20 bg-slate-900 border border-slate-700 rounded-b-xl shadow-2xl max-h-52 overflow-y-auto">
            {LANGS.map(l => (
              <button key={l.code} onClick={() => changeLang(l.code)}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800 flex items-center justify-between ${l.code === selectedLang ? 'text-indigo-400 bg-slate-800/60' : 'text-slate-300'}`}>
                <span>{l.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-[10px]">{l.hf}</span>
                  {l.code === selectedLang && <span className="text-indigo-500 text-[10px]">✓</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 px-4 py-2 text-xs text-red-200 border-b border-red-800 flex items-center justify-between gap-2 shrink-0">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-slate-800 text-slate-200 rounded-bl-sm'
            }`}>
              {msg.text.replace(/\[.*?\]/g, '').trim()}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{translating ? '🌐 Translating...' : (THINKING[activeLang] ?? 'Thinking...')}</span>
            </div>
          </div>
        )}

        {/* Live transcript preview */}
        {transcript && (
          <div className="flex justify-end">
            <div className="max-w-[88%] px-4 py-2 rounded-2xl bg-indigo-900/40 text-sm italic text-indigo-300">
              {transcript}
              <span className="animate-pulse ml-1">▍</span>
            </div>
          </div>
        )}

        {/* Complaint progress card */}
        {(complaintData.category || complaintData.description) && (
          <div className="bg-slate-800/60 rounded-xl p-3 text-xs space-y-1.5 border border-slate-700">
            <p className="text-slate-400 font-semibold">📋 Complaint in progress</p>
            {complaintData.category && (
              <p className="text-slate-300">Category: <span className="text-indigo-400 font-medium">{complaintData.category}</span></p>
            )}
            {complaintData.description && (
              <p className="text-slate-300">Description: <span className="text-slate-200">{complaintData.description.substring(0, 80)}{complaintData.description.length > 80 ? '...' : ''}</span></p>
            )}
            {complaintData.photoTaken && <p className="text-emerald-400">✓ Photo attached</p>}
          </div>
        )}

        {/* Camera button */}
        {showPhotoBtn && (
          <div className="flex flex-col items-center gap-2 py-3">
            <label htmlFor="civic-photo-voice"
              className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95 transition-all shadow-lg shadow-emerald-900/50">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold uppercase">{activeLang === 'en-IN' ? 'Camera' : 'कैमरा'}</span>
              <span className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-40" />
            </label>
            <p className="text-slate-400 text-xs text-center">
              {activeLang === 'en-IN' ? 'Tap to take photo' : 'फोटो के लिए टैप करें'}
            </p>
          </div>
        )}

        {/* Photo preview */}
        {photoPreview && (
          <div className="flex justify-center">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="complaint" className="w-32 h-32 object-cover rounded-xl border-2 border-emerald-500" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </div>
        )}

        <input
          ref={photoInputRef} id="civic-photo-voice"
          type="file" accept="image/*" capture={"environment" as any}
          className="hidden" onChange={handlePhoto}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-slate-700 bg-slate-950 shrink-0">
        <div className="flex justify-center items-center gap-6 mb-4">

          {/* Stop TTS */}
          <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false) }}
            title="Stop speaking"
            className="w-11 h-11 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
            <Volume2 className="w-5 h-5 text-slate-300" />
          </button>

          {/* Main mic */}
          <button onClick={isListening ? stopMic : startMic}
            disabled={isThinking || isSpeaking}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isListening
                ? 'bg-red-600 scale-110 ring-4 ring-red-400/30 shadow-red-900/40'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
            } disabled:opacity-40 disabled:cursor-not-allowed`}>
            {isListening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
          </button>

          {/* Reset */}
          <button onClick={resetChat} title="Reset conversation"
            className="w-11 h-11 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
            <RefreshCw className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Hands-free toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs">Hands-free mode</p>
            {autoListen && <p className="text-emerald-400 text-xs animate-pulse">active — always listening</p>}
          </div>
          <button onClick={toggleAutoListen}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              autoListen ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}>
            {autoListen ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Tech badges */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px] text-slate-600 bg-slate-800/80 px-2 py-0.5 rounded-full">LangChain</span>
          {HF_TOKEN && <span className="text-[10px] text-purple-500 bg-purple-900/20 px-2 py-0.5 rounded-full">HuggingFace MT</span>}
          <span className="text-[10px] text-orange-500 bg-orange-900/20 px-2 py-0.5 rounded-full">Groq LLaMA</span>
          <span className="text-[10px] text-green-500 bg-green-900/20 px-2 py-0.5 rounded-full">Mobile Fix ✓</span>
        </div>
      </div>
    </div>
  )
}