'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Mic, MicOff, X, Loader2, Volume2, RefreshCw, Camera, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Message { role: 'user' | 'assistant'; text: string; lang: string }
type FlowState = 'idle' | 'complaint_category' | 'complaint_description' | 'complaint_photo' | 'complaint_confirm'
interface ComplaintData { category: string; description: string; photoTaken: boolean }

// Global bridge — citizen page registers these so VoiceAgent can control it
declare global {
  interface Window {
    __civicSetTab?: (tab: string) => void
    __civicGetProjects?: () => any[]
    __civicGetComplaints?: () => any[]
    __civicGetStats?: () => any
    __civicShowProjects?: () => void
  }
}

const LANGS = [
  { code: 'en-IN', label: 'English' }, { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },   { code: 'te-IN', label: 'Telugu' },
  { code: 'bn-IN', label: 'Bengali' }, { code: 'gu-IN', label: 'Gujarati' },
  { code: 'pa-IN', label: 'Punjabi' }, { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' }, { code: 'mr-IN', label: 'Marathi' },
]
const getLangByCode = (code: string) => LANGS.find(l => l.code === code) ?? LANGS[0]

const THINKING: Record<string, string> = {
  'en-IN': 'Thinking...', 'hi-IN': 'Soch raha hun...', 'ta-IN': 'Yosikkiren...',
  'te-IN': 'Aalochistunnanu...', 'bn-IN': 'Vabchi...', 'gu-IN': 'Vichari rahyo chhu...',
  'pa-IN': 'Soch reha han...', 'kn-IN': 'Yochisuttiddene...', 'ml-IN': 'Chintikkunnu...',
  'mr-IN': 'Vichar karto ahe...',
}
const PHOTO_PROMPT: Record<string, string> = {
  'en-IN': 'Please take a photo of the problem.',
  'hi-IN': 'Ab samasya ki photo lein.',
  'ta-IN': 'Piracchanaiyin patam edungal.',
  'te-IN': 'Samasya photo teeyandi.',
  'bn-IN': 'Samasyar chhobi tuln.',
  'gu-IN': 'Samasyano photo lo.',
  'pa-IN': 'Samasya di photo lo.',
  'kn-IN': 'Samasye foto tegeyiri.',
  'ml-IN': 'Prashnathinte photo edukku.',
  'mr-IN': 'Samasyeche photo ghya.',
}

const detectScriptLang = (text: string): string | null => {
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN'
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'
  if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'
  if (/[\u0600-\u06FF]/.test(text)) return 'ur-IN'
  return null
}
const PURE_HINDI = new Set([
  'mujhe','muje','mere','mera','meri','tumhe','main','hum','aap','wo','yeh',
  'karo','karni','karna','karein','chahiye','chahie','batao','sunao','hai',
  'hain','tha','thi','the','hoga','hogi','nahi','nahin','nai','mat','aur',
  'ya','lekin','toh','bhi','bahut','thoda','zyada','sab','kuch','bilkul',
  'kya','kyun','kaise','kahan','kaun','kitna','kab','shikayat','darj',
  'pani','bijli','sadak','safai','abhi','aaj','kal','yahan','wahan',
])
const detectHinglish = (t: string) =>
  t.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(w => PURE_HINDI.has(w)).length >= 2

const NAV_INTENTS = [
  { keywords: ['complaint','complain','shikayat','shikayt','register','file complaint','darj'], tab: 'complaints', setComplaints: true },
  { keywords: ['home','dashboard','overview','main page','ghar'], tab: 'overview' },
  { keywords: ['map','naksha','location','live map'], tab: 'map' },
  { keywords: ['profile','settings','account','mera profile'], tab: 'settings' },
  { keywords: ['updates','analytics','stats','statistics'], tab: 'analytics' },
  { keywords: ['project','projects','ongoing','construction','development','kaam','nirman'], tab: 'overview', showProjects: true },
]
const detectNavIntent = (text: string) => {
  const lower = text.toLowerCase()
  return NAV_INTENTS.find(i => i.keywords.some(k => lower.includes(k))) ?? null
}

const SKIP = new Set(['the','a','an','guest','user','null','undefined','admin','na','test'])
const getFirstName = (name?: string | null): string => {
  if (!name) return ''
  const first = name.trim().split(/\s+/)[0]
  return (!first || SKIP.has(first.toLowerCase())) ? '' : first
}

const buildPrompt = (
  pathname: string, flowState: string, firstName: string,
  complaintData: ComplaintData, langCode: string, langLabel: string,
  appData: { projects: any[]; complaints: any[]; stats: any }
) => {
  const name = firstName ? `User: ${firstName}.` : ''
  const projectSummary = appData.projects.length > 0
    ? appData.projects.slice(0, 5).map(p => `- ${p.title} (${p.status}, ${p.completionPercentage}% done, at ${p.location})`).join('\n')
    : 'No projects found.'

  const steps: Record<string, string> = {
    idle: `
JOB: Help user navigate or answer questions about their civic data.

If user asks about PROJECTS / ongoing work / construction / development:
Read and summarize these projects in ${langLabel}:
${projectSummary}
Then append [TAB:overview][SHOW:projects]

STATS: Total complaints=${appData.stats.total}, Resolved=${appData.stats.resolved}, Pending=${appData.stats.pending}

Navigation tags (append at end - ONLY use these when user explicitly asks to navigate):
"register complaint" / "file complaint" / "shikayat darj" / "complaint karna" -> [TAB:complaints]
"go home" / "home page" / "dashboard" -> [TAB:overview]  
"open map" / "show map" / "naksha" -> [TAB:map]
"my profile" / "settings" / "account" -> [TAB:settings]
"updates" / "notifications" / "analytics" -> [TAB:analytics]
"show projects" / "ongoing work" -> [TAB:overview][SHOW:projects]

IMPORTANT: If user describes a problem (bijli nahi, sadak kharab, pani nahi) WITHOUT saying "complaint register karo",
do NOT add [TAB:complaints]. Instead ask them if they want to file a complaint.`,

    complaint_category: `
JOB: Detect complaint category from what user says.
bijali/electricity/light/power -> [CAT:Electricity]
sadak/road/pothole/damaged road -> [CAT:Road]
pani/water/supply -> [CAT:Water]
safai/garbage/sanitation/kachra -> [CAT:Sanitation]
nali/drain/drainage -> [CAT:Drainage]
park/garden -> [CAT:Park]
street light/lamp/light post -> [CAT:Street Light]
anything else -> [CAT:Other]
DO NOT add DESC_DONE or SUBMIT.`,

    complaint_description: `
JOB: User is describing their complaint. Accept it and append [DESC_DONE].
Whatever user says = their description. Confirm warmly + [DESC_DONE].
DO NOT add CAT or SUBMIT.`,

    complaint_photo: `
JOB: Tell user to tap the green camera button to take a photo. No tags.`,

    complaint_confirm: `
JOB: Read complaint details back to user and ask to confirm.
Category: ${complaintData.category}
Description: ${complaintData.description}
User says yes/ok/haan/submit -> [SUBMIT]
DO NOT add CAT or DESC_DONE.`,
  }

  return `You are CivicLens Voice AI. ${name}

=== LANGUAGE: REPLY IN ${langLabel.toUpperCase()} ONLY ===
User spoke: ${langLabel} (${langCode})
English->English. Hindi->Hindi. Never mix languages.
=====================================================

${steps[flowState] ?? steps.idle}

Rules: 2-3 short sentences max. Friendly. Never show tags to user.
Flow: ${flowState} | Page: ${pathname}`.trim()
}

async function callGroq(apiKey: string, messages: Message[], systemPrompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))],
      max_tokens: 200, temperature: 0.1,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? 'Please try again.'
}

export default function VoiceAgent() {
  const [isOpen, setIsOpen]               = useState(false)
  const [isListening, setIsListening]     = useState(false)
  const [isSpeaking, setIsSpeaking]       = useState(false)
  const [isThinking, setIsThinking]       = useState(false)
  const [autoListen, setAutoListen]       = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(true)
  const [messages, setMessages]           = useState<Message[]>([])
  const [transcript, setTranscript]       = useState('')
  const [statusText, setStatusText]       = useState('Tap mic to speak')
  const [selectedLang, setSelectedLang]   = useState('en-IN')
  const [activeLang, setActiveLang]       = useState('en-IN')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [flowState, setFlowState]         = useState<FlowState>('idle')
  const [complaintData, setComplaintData] = useState<ComplaintData>({ category: '', description: '', photoTaken: false })
  const [errorMessage, setErrorMessage]   = useState<string | null>(null)
  const [showPhotoBtn, setShowPhotoBtn]   = useState(false)
  const [photoPreview, setPhotoPreview]   = useState<string | null>(null)

  const recognitionRef  = useRef<any>(null)
  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const voicesRef       = useRef<SpeechSynthesisVoice[]>([])
  const selectedLangRef = useRef('en-IN')
  const isSpeakingRef   = useRef(false)
  const isThinkingRef   = useRef(false)
  const autoListenRef   = useRef(false)
  const flowStateRef    = useRef<FlowState>('idle')
  const activeLangRef   = useRef('en-IN')
  const startMicRef     = useRef<() => void>(() => {})
  const photoInputRef   = useRef<HTMLInputElement>(null)

  const router   = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY

  useEffect(() => { selectedLangRef.current = selectedLang }, [selectedLang])
  useEffect(() => { autoListenRef.current   = autoListen   }, [autoListen])
  useEffect(() => { isSpeakingRef.current   = isSpeaking   }, [isSpeaking])
  useEffect(() => { isThinkingRef.current   = isThinking   }, [isThinking])
  useEffect(() => { flowStateRef.current    = flowState    }, [flowState])
  useEffect(() => { activeLangRef.current   = activeLang   }, [activeLang])

  useEffect(() => {
    if (flowState === 'complaint_photo' && recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
      setIsListening(false)
    }
  }, [flowState])

  useEffect(() => {
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices() }
    load(); window.speechSynthesis.onvoiceschanged = load
  }, [])

  useEffect(() => {
    if (showChatPanel) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showChatPanel])

  // Tab switcher — uses global bridge first, then router fallback
  const switchTab = useCallback((tab: string) => {
    console.log('[TAB] switching to:', tab)
    if (window.__civicSetTab) {
      window.__civicSetTab(tab)
    } else {
      router.push(`/citizen?tab=${tab}`)
    }
    if (autoListenRef.current) setShowChatPanel(false)
  }, [router])

  const speak = useCallback((text: string, lang: string) => {
    window.speechSynthesis.cancel()
    const clean = text.replace(/\[.*?\]/g, '').trim()
    if (!clean) return
    const utt = new SpeechSynthesisUtterance(clean)
    utt.lang = lang; utt.rate = 0.92; utt.pitch = 1.05
    utt.voice =
      voicesRef.current.find(v => v.lang === lang && v.name.includes('Google')) ??
      voicesRef.current.find(v => v.lang === lang) ??
      voicesRef.current.find(v => v.lang.startsWith(lang.split('-')[0])) ?? null
    utt.onstart = () => { setIsSpeaking(true); setStatusText('Speaking...') }
    utt.onend = () => {
      setIsSpeaking(false)
      setStatusText(autoListenRef.current ? 'Listening...' : 'Tap mic to speak')
      if (autoListenRef.current) {
        setTimeout(() => {
          if (autoListenRef.current && !isThinkingRef.current && !recognitionRef.current)
            startMicRef.current()
        }, 2000)
      }
      if (flowStateRef.current === 'complaint_photo' && photoInputRef.current) {
        try { photoInputRef.current.click() } catch {}
      }
    }
    utt.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utt)
  }, [])

  const fillField = (id: string, value: string) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
    if (!el) return

    // Use React internal setter to properly trigger controlled component onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el.tagName === 'SELECT'
        ? window.HTMLSelectElement.prototype
        : el.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype,
      'value'
    )?.set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value)
    } else {
      el.value = value
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    console.log('[FILL]', id, '=', value, '| element:', el.tagName)
  }

  const handlePhotoSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    setComplaintData(p => ({ ...p, photoTaken: true }))
    setShowPhotoBtn(false)
    setFlowState('complaint_confirm')
    const lang = activeLangRef.current
    const msg = lang === 'en-IN'
      ? 'Great! Photo added. Say yes to submit your complaint.'
      : 'Bahut accha! Photo jod di. Haan boliye darj karne ke liye.'
    setMessages(p => [...p, { role: 'assistant', text: msg, lang }])
    speak(msg, lang)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }, [speak])

  const handleResponse = useCallback((reply: string, userMsg: string, lang: string) => {
    // Tab switch - ONLY in idle flow, never during complaint filling
    const tabMatch = reply.match(/\[TAB:(.*?)\]/)
    if (tabMatch && flowStateRef.current === 'idle') {
      const targetTab = tabMatch[1].trim()
      setTimeout(() => switchTab(targetTab), 1200)
      // When navigating to complaints, start the complaint flow
      if (targetTab === 'complaints') {
        setFlowState('complaint_category')
        setComplaintData({ category: '', description: '', photoTaken: false })
      }
    }

    // Show projects modal
    if (reply.includes('[SHOW:projects]')) {
      setTimeout(() => {
        window.__civicShowProjects?.()
      }, 1500)
    }

    // Category
    const cat = reply.match(/\[CAT:(.*?)\]/)
    if (cat) {
      const map: Record<string, string> = {
        Road: 'Road & Infrastructure', Water: 'Water Supply', Electricity: 'Electricity',
        Sanitation: 'Sanitation', 'Street Light': 'Street Light', Drainage: 'Drainage',
        Park: 'Park', Other: 'Other',
      }
      const full = map[cat[1].trim()] ?? cat[1].trim()
      setComplaintData(p => ({ ...p, category: full }))
      fillField('complaint-category', full)
      setFlowState('complaint_description')
      return
    }

    // Description
    if (reply.includes('[DESC_DONE]')) {
      setComplaintData(p => ({ ...p, description: userMsg }))
      fillField('complaint-description', userMsg)
      setFlowState('complaint_photo')
      setShowPhotoBtn(true)
      const photoMsg = PHOTO_PROMPT[lang] ?? PHOTO_PROMPT['en-IN']
      setTimeout(() => {
        setMessages(p => [...p, { role: 'assistant', text: photoMsg, lang }])
        speak(photoMsg, lang)
      }, 300)
      return
    }

    // Submit
    if (reply.includes('[SUBMIT]')) {
      const yes = ['yes','ok','okay','sure','submit','haan','ha','bilkul','zaroor','yeah']
      if (yes.some(w => userMsg.toLowerCase().includes(w))) {
        document.getElementById('complaint-submit')?.click()
        setFlowState('idle'); setShowPhotoBtn(false)
      }
    }
  }, [switchTab, speak])

  const askGroq = useCallback(async (userMessage: string, recognitionLang: string) => {
    if (!GROQ_KEY) { setErrorMessage('Add NEXT_PUBLIC_GROQ_API_KEY to .env.local'); return }

    const scriptLang = detectScriptLang(userMessage)
    const hinglish   = !scriptLang && detectHinglish(userMessage)
    const lang       = scriptLang ?? (hinglish ? 'hi-IN' : recognitionLang)
    const langInfo   = getLangByCode(lang)
    const navIntent  = detectNavIntent(userMessage)

    setActiveLang(lang); setIsThinking(true); setStatusText('Thinking...'); setErrorMessage(null)

    const newMsgs: Message[] = [...messages, { role: 'user', text: userMessage, lang }]
    setMessages(newMsgs)

    // Read live data from citizen page
    const appData = {
      projects:   window.__civicGetProjects?.()   ?? [],
      complaints: window.__civicGetComplaints?.() ?? [],
      stats:      window.__civicGetStats?.()      ?? { total: 0, resolved: 0, pending: 0 },
    }

    try {
      const firstName = getFirstName(user?.name)
      const prompt = buildPrompt(pathname, flowStateRef.current, firstName, complaintData, lang, langInfo.label, appData)
      const reply  = await callGroq(GROQ_KEY!, newMsgs, prompt)
      console.log('[AI]', reply)

      setMessages(p => [...p, { role: 'assistant', text: reply, lang }])
      speak(reply, lang)
      handleResponse(reply, userMessage, lang)

      // Client-side nav override ONLY when idle (never interrupt complaint flow)
      if (navIntent && !reply.includes('[TAB:') && flowStateRef.current === 'idle') {
        setTimeout(() => {
          switchTab(navIntent.tab)
          if ((navIntent as any).showProjects) setTimeout(() => window.__civicShowProjects?.(), 600)
        }, 1500)
      }
    } catch (err: any) {
      const isAuth = err.message.includes('401') || err.message.includes('403')
      setErrorMessage(isAuth ? 'Invalid Groq key' : 'API error - try again')
      speak('Something went wrong, please try again.', lang)
    } finally {
      setIsThinking(false)
    }
  }, [messages, speak, pathname, complaintData, handleResponse, user, GROQ_KEY, switchTab])

  const startMic = useCallback(() => {
    if (isSpeakingRef.current) return
    if (isThinkingRef.current) return
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { setErrorMessage('Use Chrome or Edge for voice'); return }

    const rec = new SR()
    recognitionRef.current = rec
    rec.continuous = true; rec.interimResults = true; rec.lang = selectedLangRef.current

    rec.onstart = () => { setIsListening(true); setStatusText('Listening...') }
    rec.onresult = (e: any) => {
      const result = e.results[e.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal) {
        setTranscript(''); recognitionRef.current = null; rec.stop()
        askGroq(text, selectedLangRef.current)
      }
    }
    rec.onerror = (e: any) => {
      recognitionRef.current = null; setIsListening(false)
      if (e.error === 'not-allowed') setErrorMessage('Microphone permission denied')
    }
    rec.onend = () => {
      recognitionRef.current = null; setIsListening(false)
      if (!autoListenRef.current) { setStatusText('Tap mic to speak'); return }
      const tryStart = () => {
        if (!autoListenRef.current) return
        if (isSpeakingRef.current || isThinkingRef.current) { setTimeout(tryStart, 1500); return }
        startMicRef.current()
      }
      setTimeout(tryStart, (isSpeakingRef.current || isThinkingRef.current) ? 4000 : 2000)
    }
    try { rec.start() } catch { recognitionRef.current = null }
  }, [askGroq])

  useEffect(() => { startMicRef.current = startMic }, [startMic])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false); setTranscript(''); setStatusText('Tap mic to speak')
  }, [])

  const toggleAutoListen = () => {
    setAutoListen(prev => {
      if (prev) { stopListening(); setShowChatPanel(true); return false }
      setShowChatPanel(false)
      setTimeout(() => startMicRef.current(), 300)
      return true
    })
  }

  const changeLang = (code: string) => {
    setSelectedLang(code); setActiveLang(code); setShowLangPicker(false)
    if (isListening) { stopListening(); setTimeout(() => startMic(), 300) }
  }

  useEffect(() => {
    if (!isOpen || messages.length > 0) return
    const firstName = getFirstName(user?.name)
    const greetings: Record<string, string> = {
      'en-IN': firstName ? `Hello ${firstName}! How can I help you today?` : "Hello! I'm CivicLens AI. How can I help?",
      'hi-IN': firstName ? `Namaste ${firstName} ji! Kya madad chahiye?` : 'Namaste! Main CivicLens AI hun.',
      'pa-IN': `Sat Sri Akal! Main CivicLens AI han.`,
      'ta-IN': `Vanakkam! Naan CivicLens AI.`,
      'te-IN': `Namaskaram! Nenu CivicLens AI.`,
      'bn-IN': `Nomoshkar! Ami CivicLens AI.`,
      'gu-IN': `Kem cho! Hu CivicLens AI chhu.`,
      'kn-IN': `Namaskara! Naanu CivicLens AI.`,
      'ml-IN': `Namaskaram! CivicLens AI aanu.`,
      'mr-IN': `Namaskar! Mi CivicLens AI aahe.`,
    }
    const greeting = greetings[selectedLang] ?? greetings['en-IN']
    setTimeout(() => {
      setMessages([{ role: 'assistant', text: greeting, lang: selectedLang }])
      speak(greeting, selectedLang)
    }, 600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedLang])

  const handleFullClose = () => {
    stopListening(); window.speechSynthesis.cancel()
    setAutoListen(false); setIsOpen(false); setMessages([])
    setFlowState('idle'); setShowPhotoBtn(false); setShowChatPanel(true)
    setErrorMessage(null); setPhotoPreview(null)
    setComplaintData({ category: '', description: '', photoTaken: false })
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const firstName   = getFirstName(user?.name)
  const langDisplay = getLangByCode(selectedLang)
  const replyDisplay = getLangByCode(activeLang)
  const headerBg = isListening ? 'bg-red-600' : isSpeaking ? 'bg-emerald-600' : isThinking ? 'bg-amber-600' : 'bg-indigo-600'

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="fixed bottom-24 left-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-all active:scale-95">
      <Mic className="w-6 h-6" />
    </button>
  )

  if (!showChatPanel && !autoListen) return (
    <button onClick={() => setShowChatPanel(true)} className="fixed bottom-24 left-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-all active:scale-95">
      <Mic className="w-6 h-6" />
    </button>
  )

  if (autoListen && !showChatPanel) return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-black/75 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isListening ? 'bg-red-400 animate-pulse' : isSpeaking ? 'bg-emerald-400 animate-pulse' : isThinking ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
      <span className="text-white/80 text-xs max-w-48 truncate">{transcript || (isThinking ? (THINKING[activeLang] ?? 'Thinking...') : statusText)}</span>
      <span className="text-white/40 text-xs flex-shrink-0">{replyDisplay.label}</span>
      <button onClick={isListening ? stopListening : startMic} disabled={isThinking || isSpeaking}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isListening ? 'bg-red-500' : 'bg-indigo-500 hover:bg-indigo-400'} disabled:opacity-40`}>
        {isListening ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-white" />}
      </button>
      <button onClick={() => setShowChatPanel(true)} className="text-white/50 hover:text-white/80 text-xs px-2 py-1 rounded-full border border-white/10">chat</button>
      <button onClick={() => { setAutoListen(false); setShowChatPanel(true); stopListening() }} className="text-white/40 hover:text-white/80"><X className="w-4 h-4" /></button>
    </div>
  )

  return (
    <div className="fixed bottom-24 left-6 z-50 w-80 bg-[#0d1117] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-3 ${headerBg} transition-colors duration-300`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            {isListening ? <MicOff className="w-4 h-4 text-white" /> : isSpeaking ? <Volume2 className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">CivicLens AI{firstName ? ` - ${firstName}` : ''}</p>
            <p className="text-white/70 text-xs">{statusText}</p>
          </div>
        </div>
        <button onClick={handleFullClose} className="text-white/80 hover:text-white ml-2"><X className="w-5 h-5" /></button>
      </div>

      <div className="relative bg-slate-900 border-b border-slate-800">
        <button onClick={() => setShowLangPicker(p => !p)} className="w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-slate-800 transition-colors">
          <span className="text-slate-400">Speak in: <span className="text-indigo-400 font-medium">{langDisplay.label}</span>{activeLang !== selectedLang && <span className="text-emerald-400 ml-2">replying in {replyDisplay.label}</span>}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLangPicker ? 'rotate-180' : ''}`} />
        </button>
        {showLangPicker && (
          <div className="absolute top-full left-0 right-0 z-20 bg-slate-900 border border-slate-700 rounded-b-xl shadow-xl max-h-52 overflow-y-auto">
            {LANGS.map(l => (
              <button key={l.code} onClick={() => changeLang(l.code)} className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800 flex items-center justify-between ${l.code === selectedLang ? 'text-indigo-400 bg-slate-800/60' : 'text-slate-300'}`}>
                <span>{l.label}</span>
                {l.code === selectedLang && <span className="text-indigo-600 text-xs">selected</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-900/60 px-4 py-2 text-xs text-red-200 border-b border-red-700 flex items-center justify-between gap-2">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
              {msg.text.replace(/\[.*?\]/g, '')}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /><span>{THINKING[activeLang] ?? 'Thinking...'}</span>
            </div>
          </div>
        )}
        {transcript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] px-4 py-2 rounded-2xl bg-indigo-900/40 text-sm italic text-indigo-300">{transcript}</div>
          </div>
        )}
        <input ref={photoInputRef} id="civic-camera-input" type="file" accept="image/*" capture={"environment" as any} className="hidden" onChange={handlePhotoSelected} />
        {photoPreview && (
          <div className="flex justify-center">
            <div className="relative">
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="complaint" className="w-32 h-32 object-cover rounded-xl border-2 border-emerald-500" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>
            </div>
          </div>
        )}
        {showPhotoBtn && (
          <div className="flex flex-col items-center gap-2 py-2">
            <label htmlFor="civic-camera-input" className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95" style={{ animation: 'pulse 1.2s ease-in-out infinite' }}>
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs font-semibold">{activeLang === 'en-IN' ? 'CAMERA' : 'कैमरा'}</span>
              <span className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-50" />
            </label>
            <p className="text-slate-300 text-xs text-center">{activeLang === 'en-IN' ? 'Tap to open camera' : 'कैमरा खोलने के लिए टैप करें'}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-950">
        <div className="flex justify-center items-center gap-6 mb-4">
          <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false) }} className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"><Volume2 className="w-5 h-5 text-slate-300" /></button>
          <button onClick={isListening ? stopListening : startMic} disabled={isThinking || isSpeaking}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${isListening ? 'bg-red-600 scale-110 ring-4 ring-red-400/30' : 'bg-indigo-600 hover:bg-indigo-500'} disabled:opacity-40 disabled:cursor-not-allowed`}>
            {isListening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
          </button>
          <button onClick={() => { setMessages([]); setFlowState('idle'); setShowPhotoBtn(false); setComplaintData({ category: '', description: '', photoTaken: false }) }} className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"><RefreshCw className="w-5 h-5 text-slate-300" /></button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs">Hands-free mode</p>
            {autoListen && <p className="text-emerald-400 text-xs animate-pulse">active - app visible</p>}
          </div>
          <button onClick={toggleAutoListen} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${autoListen ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{autoListen ? 'ON' : 'OFF'}</button>
        </div>
      </div>
    </div>
  )
}