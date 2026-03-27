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

// ── HuggingFace Translation ────────────────────────────────────────────────
const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN

const translateWithHF = async (text: string, srcLang: string, tgtLang: string): Promise<string> => {
  if (srcLang === tgtLang || srcLang === 'en' || !HF_TOKEN) return text
  try {
    // Use Helsinki-NLP opus-mt models for translation
    const modelId = `Helsinki-NLP/opus-mt-${srcLang}-en`
    const res = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: text }),
    })
    if (!res.ok) return text
    const data = await res.json()
    return data?.[0]?.translation_text || text
  } catch { return text }
}

// ── LangChain-style prompt builder ────────────────────────────────────────
// We implement a LangChain-inspired ChatPromptTemplate pattern
interface PromptVariable {
  langLabel: string; langCode: string; flowState: string;
  firstName: string; complaintData: ComplaintData;
  projects: any[]; stats: any; pathname: string;
}

const buildLangChainMessages = (vars: PromptVariable) => {
  const { langLabel, flowState, firstName, complaintData, projects, stats } = vars
  const name = firstName ? `User's name: ${firstName}.` : ''

  const projectList = projects.length > 0
    ? projects.slice(0, 5).map(p => `• ${p.title} (${p.status}, ${p.completionPercentage}%)`).join('\n')
    : 'No projects found.'

  // System message — LangChain SystemMessage equivalent
  const systemContent = `You are CivicLens Voice AI Assistant for Hisar District, Haryana.
${name}

CRITICAL LANGUAGE RULE:
- User is speaking ${langLabel}
- YOU MUST REPLY IN ${langLabel.toUpperCase()} ONLY
- English → English reply. Hindi → Hindi reply. Tamil → Tamil reply. Never mix.

RESPONSE RULES:
- Maximum 2-3 short sentences
- Friendly, helpful tone
- Never show control tags like [TAB:] to user`

  // Flow-specific human message template — LangChain HumanMessagePromptTemplate equivalent
  const flowInstructions: Record<FlowState, string> = {
    idle: `
AVAILABLE DATA:
Projects:
${projectList}
Stats: Total=${stats.total}, Resolved=${stats.resolved}, Pending=${stats.pending}

INTENT DETECTION (add tag at end of response):
- "complaint/shikayat/register" mentioned → reply + [TAB:complaints]
- "map/naksha" → reply + [TAB:map]
- "home/dashboard" → reply + [TAB:overview]
- "profile/settings" → reply + [TAB:settings]
- "projects/construction/kaam" → summarize projects in ${langLabel} + [TAB:overview][SHOW:projects]
- User describes a problem (water/road/electricity) WITHOUT asking to register → ask if they want to file a complaint, do NOT add [TAB:complaints]`,

    complaint_category: `
TASK: Detect complaint category from user's speech.
Map to one of:
- Road/pothole/sadak → [CAT:Road & Infrastructure]  
- Water/pani/supply → [CAT:Water Supply]
- Electricity/bijli/power → [CAT:Electricity]
- Sanitation/garbage/safai → [CAT:Sanitation]
- Drain/nali/flooding → [CAT:Drainage]
- Street light/lamp → [CAT:Street Light]
- Park/garden → [CAT:Park]
- Anything else → [CAT:Other]
Confirm the category warmly + [CAT:CategoryName]
DO NOT add [TAB:] or [DESC_DONE]`,

    complaint_description: `
TASK: User is describing their complaint problem.
- Accept EXACTLY what they say as the description
- Confirm you understood in ${langLabel}
- Append [DESC_DONE] at end
- Their words ARE the description - don't paraphrase
DO NOT add [CAT:] or [SUBMIT] or [TAB:]`,

    complaint_photo: `
TASK: Ask user to tap the camera button to take a photo.
No special tags needed.`,

    complaint_confirm: `
TASK: Confirm complaint details with user.
Category: ${complaintData.category}
Description: ${complaintData.description}

Read back the details briefly in ${langLabel}.
If user says yes/ok/haan/submit/confirm → add [SUBMIT]
If user says no/nahin/cancel → say OK, ask what to change`,
  }

  return {
    system: systemContent,
    instruction: flowInstructions[flowState as FlowState] || flowInstructions.idle,
  }
}

// ── Groq LLM call (LangChain ChatGroq equivalent) ─────────────────────────
const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY

const callGroqLLM = async (
  userMessage: string,
  history: Message[],
  systemPrompt: string,
  instruction: string
): Promise<string> => {
  if (!GROQ_KEY) throw new Error('Missing NEXT_PUBLIC_GROQ_API_KEY')

  // Build conversation — LangChain MessagesPlaceholder equivalent
  const historyMsgs = history.slice(-8).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.text,
  }))

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `${systemPrompt}\n\n${instruction}` },
        ...historyMsgs,
        { role: 'user', content: userMessage },
      ],
      max_tokens: 250,
      temperature: 0.15,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? 'Please try again.'
}

// ── Language detection ────────────────────────────────────────────────────
const detectScriptLang = (text: string): string | null => {
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN'
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'
  if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'
  return null
}

const HINDI_WORDS = new Set(['mujhe','mere','mera','meri','main','hum','aap','hai','hain','nahi','nahin','karo','karein','chahiye','batao','shikayat','pani','bijli','sadak','safai','haan','theek'])
const detectHinglish = (t: string) => t.toLowerCase().split(/\s+/).filter(w => HINDI_WORDS.has(w)).length >= 2

const PHOTO_PROMPTS: Record<string, string> = {
  'en-IN': 'Please tap the green camera button below to take a photo of the issue.',
  'hi-IN': 'Neeche hare camera button ko tap karein aur samasya ki photo lein.',
  'ta-IN': 'Piracchanaiyin patam edukka padathai tappaveyyungal.',
  'te-IN': 'Dayachesi camera button ni tap cheyandi photo teeyandiki.',
  'bn-IN': 'Dayakore camera button e tap korun chhabi tolar jonyo.',
  'gu-IN': 'Maherbani kari camera button tapo ane samasyano photo lo.',
  'pa-IN': 'Camera button te tap karo samasya di photo lain layi.',
  'kn-IN': 'Samasye foto tegedukollalu camera button tap madi.',
  'ml-IN': 'Prashnathinte photo edukkaan camera button tap cheyyu.',
  'mr-IN': 'Samasyeche photo ghenyasathi camera button tap kara.',
}

const THINKING_TEXTS: Record<string, string> = {
  'en-IN': 'Thinking...', 'hi-IN': 'Soch raha hun...', 'ta-IN': 'Yosikkiren...',
  'te-IN': 'Aalochistunnanu...', 'bn-IN': 'Vabchi...', 'gu-IN': 'Vichari rahyo...',
  'pa-IN': 'Soch reha han...', 'kn-IN': 'Yochisuttiddene...', 'ml-IN': 'Chintikkunnu...', 'mr-IN': 'Vichar karto...',
}

const getFirstName = (name?: string | null) => {
  if (!name) return ''
  const skip = new Set(['guest','user','null','undefined','admin','test'])
  const first = name.trim().split(/\s+/)[0]
  return (!first || skip.has(first.toLowerCase())) ? '' : first
}

// ── FIX: Direct React state setter for description ────────────────────────
// Instead of trying to trigger DOM events (unreliable with React controlled components),
// we expose a global setter that the citizen page registers
const setComplaintFieldGlobally = (field: 'category' | 'description', value: string) => {
  if (field === 'category' && window.__civicSetCategory) {
    window.__civicSetCategory(value)
    return true
  }
  if (field === 'description' && window.__civicSetDescription) {
    window.__civicSetDescription(value)
    return true
  }
  // Fallback: try DOM manipulation with multiple event types
  const idMap = { category: 'complaint-category', description: 'complaint-description' }
  const el = document.getElementById(idMap[field]) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  if (!el) return false
  try {
    // Try React fiber setter
    const key = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'))
    if (key) {
      const fiber = (el as any)[key]
      const props = fiber?.memoizedProps || fiber
      if (props?.onChange) {
        props.onChange({ target: { value }, currentTarget: { value } })
        return true
      }
    }
    // Fallback: native value setter
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (setter) {
      setter.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    } else {
      el.value = value
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    return true
  } catch (e) {
    console.warn('[VoiceAgent] fillField fallback error:', e)
    return false
  }
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function VoiceAgent() {
  const [isOpen, setIsOpen]             = useState(false)
  const [isListening, setIsListening]   = useState(false)
  const [isSpeaking, setIsSpeaking]     = useState(false)
  const [isThinking, setIsThinking]     = useState(false)
  const [autoListen, setAutoListen]     = useState(false)
  const [showChat, setShowChat]         = useState(true)
  const [messages, setMessages]         = useState<Message[]>([])
  const [transcript, setTranscript]     = useState('')
  const [statusText, setStatusText]     = useState('Tap mic to speak')
  const [selectedLang, setSelectedLang] = useState('en-IN')
  const [activeLang, setActiveLang]     = useState('en-IN')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [flowState, setFlowState]       = useState<FlowState>('idle')
  const [complaintData, setComplaintData] = useState<ComplaintData>({ category: '', description: '', photoTaken: false })
  const [error, setError]               = useState<string | null>(null)
  const [showPhotoBtn, setShowPhotoBtn] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [translating, setTranslating]   = useState(false)

  const recogRef        = useRef<any>(null)
  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const voicesRef       = useRef<SpeechSynthesisVoice[]>([])
  const refs = {
    selectedLang: useRef('en-IN'), activeLang: useRef('en-IN'),
    isSpeaking: useRef(false), isThinking: useRef(false),
    autoListen: useRef(false), flowState: useRef<FlowState>('idle'),
    startMic: useRef<() => void>(() => {}),
  }
  const photoInputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  // Sync refs
  useEffect(() => { refs.selectedLang.current = selectedLang }, [selectedLang])
  useEffect(() => { refs.activeLang.current   = activeLang   }, [activeLang])
  useEffect(() => { refs.isSpeaking.current   = isSpeaking   }, [isSpeaking])
  useEffect(() => { refs.isThinking.current   = isThinking   }, [isThinking])
  useEffect(() => { refs.autoListen.current   = autoListen   }, [autoListen])
  useEffect(() => { refs.flowState.current    = flowState    }, [flowState])

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

  // ── Speak ────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, lang: string) => {
    window.speechSynthesis.cancel()
    const clean = text.replace(/\[.*?\]/g, '').trim()
    if (!clean) return
    const utt    = new SpeechSynthesisUtterance(clean)
    utt.lang     = lang; utt.rate = 0.92; utt.pitch = 1.05
    utt.voice    =
      voicesRef.current.find(v => v.lang === lang && v.name.includes('Google')) ??
      voicesRef.current.find(v => v.lang === lang) ??
      voicesRef.current.find(v => v.lang.startsWith(lang.split('-')[0])) ?? null
    utt.onstart  = () => { setIsSpeaking(true); setStatusText('Speaking...') }
    utt.onend    = () => {
      setIsSpeaking(false)
      setStatusText(refs.autoListen.current ? 'Listening...' : 'Tap mic to speak')
      if (refs.autoListen.current && !refs.isThinking.current && !recogRef.current)
        setTimeout(() => refs.startMic.current(), 2000)
      if (refs.flowState.current === 'complaint_photo' && photoInputRef.current)
        setTimeout(() => { try { photoInputRef.current?.click() } catch {} }, 500)
    }
    utt.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utt)
  }, [])

  // ── Handle photo capture ─────────────────────────────────────────────────
  const handlePhotoSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    setComplaintData(p => ({ ...p, photoTaken: true }))
    setShowPhotoBtn(false)
    setFlowState('complaint_confirm')
    const lang = refs.activeLang.current
    const msg  = lang === 'en-IN'
      ? 'Photo added! Say "yes" or "submit" to file the complaint, or "no" to cancel.'
      : 'Photo jod di! "Haan" ya "submit" bolein complaint darj karne ke liye.'
    setMessages(p => [...p, { role: 'assistant', text: msg, lang }])
    speak(msg, lang)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }, [speak])

  // ── Parse AI response & execute actions ──────────────────────────────────
  const handleAIResponse = useCallback((reply: string, userMsg: string, lang: string) => {
    // Navigation
    const tabMatch = reply.match(/\[TAB:(.*?)\]/)
    if (tabMatch && refs.flowState.current === 'idle') {
      const tab = tabMatch[1].trim()
      setTimeout(() => {
        if (window.__civicSetTab) window.__civicSetTab(tab)
        else router.push(`/citizen?tab=${tab}`)
      }, 1200)
      if (tab === 'complaints') {
        setFlowState('complaint_category')
        setComplaintData({ category: '', description: '', photoTaken: false })
      }
    }

    // Show projects
    if (reply.includes('[SHOW:projects]'))
      setTimeout(() => window.__civicShowProjects?.(), 1500)

    // Category detected
    const catMatch = reply.match(/\[CAT:(.*?)\]/)
    if (catMatch) {
      const cat = catMatch[1].trim()
      setComplaintData(p => ({ ...p, category: cat }))
      // Try global setter first, then DOM
      const set = setComplaintFieldGlobally('category', cat)
      console.log('[VOICE] set category:', cat, '| success:', set)
      setFlowState('complaint_description')
      return
    }

    // Description confirmed — THIS IS THE KEY FIX
    if (reply.includes('[DESC_DONE]')) {
      // Use the raw user speech as description
      const desc = userMsg.trim()
      setComplaintData(p => ({ ...p, description: desc }))
      // Try multiple methods to set the description field
      const set = setComplaintFieldGlobally('description', desc)
      console.log('[VOICE] set description:', desc, '| success:', set)
      // Move to photo step
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
      const yesWords = ['yes','ok','okay','sure','submit','haan','ha','bilkul','zaroor','yeah','theek','confirm']
      if (yesWords.some(w => userMsg.toLowerCase().includes(w))) {
        console.log('[VOICE] submitting complaint')
        document.getElementById('complaint-submit')?.click()
        setFlowState('idle')
        setShowPhotoBtn(false)
        setPhotoPreview(null)
      }
    }
  }, [router, speak])

  // ── Main AI pipeline ──────────────────────────────────────────────────────
  const askAI = useCallback(async (userMsg: string, recogLang: string) => {
    const scriptLang = detectScriptLang(userMsg)
    const hinglish   = !scriptLang && detectHinglish(userMsg)
    const lang       = scriptLang ?? (hinglish ? 'hi-IN' : recogLang)
    const langInfo   = getLang(lang)

    setActiveLang(lang)
    setIsThinking(true)
    setStatusText('Thinking...')
    setError(null)

    const newHistory: Message[] = [...messages, { role: 'user', text: userMsg, lang }]
    setMessages(newHistory)

    try {
      // Step 1: If non-English, translate to English for better LLM understanding
      let processedMsg = userMsg
      if (lang !== 'en-IN' && HF_TOKEN) {
        setTranslating(true)
        const hfLang = langInfo.hf
        processedMsg = await translateWithHF(userMsg, hfLang, 'en')
        setTranslating(false)
        console.log('[HF Translate]', userMsg, '→', processedMsg)
      }

      // Step 2: Build LangChain-style prompt
      const appData = {
        projects:   window.__civicGetProjects?.()   ?? [],
        complaints: window.__civicGetComplaints?.() ?? [],
        stats:      window.__civicGetStats?.()      ?? { total: 0, resolved: 0, pending: 0 },
      }
      const promptVars: PromptVariable = {
        langLabel: langInfo.label, langCode: lang,
        flowState: refs.flowState.current,
        firstName: getFirstName(user?.name),
        complaintData, projects: appData.projects,
        stats: appData.stats, pathname,
      }
      const { system, instruction } = buildLangChainMessages(promptVars)

      // Step 3: Call Groq LLM (ChatGroq equivalent)
      // Use translated message for LLM but original for description storage
      const reply = await callGroqLLM(processedMsg, newHistory, system, instruction)
      console.log('[AI reply]', reply)

      const cleanReply = reply.replace(/\[.*?\]/g, '').trim()
      setMessages(p => [...p, { role: 'assistant', text: cleanReply || reply, lang }])
      speak(reply, lang)
      // Pass ORIGINAL user message (not translated) for description
      handleAIResponse(reply, userMsg, lang)

    } catch (err: any) {
      console.error('[askAI]', err)
      const msg = err.message?.includes('401') || err.message?.includes('403')
        ? 'Invalid API key. Check NEXT_PUBLIC_GROQ_API_KEY.'
        : 'Something went wrong. Please try again.'
      setError(msg)
      speak('Something went wrong, please try again.', lang)
    } finally {
      setIsThinking(false)
      setTranslating(false)
    }
  }, [messages, speak, handleAIResponse, complaintData, pathname, user])

  // ── Speech Recognition ────────────────────────────────────────────────────
  const startMic = useCallback(() => {
    if (refs.isSpeaking.current || refs.isThinking.current) return
    if (recogRef.current) { try { recogRef.current.abort() } catch {} recogRef.current = null }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { setError('Use Chrome or Edge for voice input'); return }

    const rec         = new SR()
    recogRef.current  = rec
    rec.continuous    = true
    rec.interimResults = true
    rec.lang          = refs.selectedLang.current

    rec.onstart   = () => { setIsListening(true); setStatusText('Listening...') }
    rec.onresult  = (e: any) => {
      const result = e.results[e.results.length - 1]
      const text   = result[0].transcript
      setTranscript(text)
      if (result.isFinal) {
        setTranscript('')
        recogRef.current = null
        rec.stop()
        askAI(text, refs.selectedLang.current)
      }
    }
    rec.onerror = (e: any) => {
      recogRef.current = null; setIsListening(false)
      if (e.error === 'not-allowed') setError('Microphone permission denied')
    }
    rec.onend = () => {
      recogRef.current = null; setIsListening(false)
      if (!refs.autoListen.current) { setStatusText('Tap mic to speak'); return }
      const retry = () => {
        if (!refs.autoListen.current) return
        if (refs.isSpeaking.current || refs.isThinking.current) { setTimeout(retry, 1500); return }
        refs.startMic.current()
      }
      setTimeout(retry, refs.isSpeaking.current ? 4000 : 2000)
    }
    try { rec.start() } catch { recogRef.current = null }
  }, [askAI])

  useEffect(() => { refs.startMic.current = startMic }, [startMic])

  const stopMic = useCallback(() => {
    if (recogRef.current) { try { recogRef.current.stop() } catch {} try { recogRef.current.abort() } catch {} recogRef.current = null }
    setIsListening(false); setTranscript(''); setStatusText('Tap mic to speak')
  }, [])

  const toggleAutoListen = () => {
    setAutoListen(prev => {
      if (prev) { stopMic(); setShowChat(true); return false }
      setShowChat(false)
      setTimeout(() => refs.startMic.current(), 300)
      return true
    })
  }

  const changeLang = (code: string) => {
    setSelectedLang(code); setActiveLang(code); setShowLangPicker(false)
    if (isListening) { stopMic(); setTimeout(() => startMic(), 300) }
  }

  const resetConversation = () => {
    setMessages([]); setFlowState('idle'); setShowPhotoBtn(false)
    setPhotoPreview(null); setError(null)
    setComplaintData({ category: '', description: '', photoTaken: false })
  }

  const handleClose = () => {
    stopMic(); window.speechSynthesis.cancel(); setAutoListen(false)
    setIsOpen(false); resetConversation(); setShowChat(true)
  }

  // Greeting on open
  useEffect(() => {
    if (!isOpen || messages.length > 0) return
    const firstName = getFirstName(user?.name)
    const greetings: Record<string, string> = {
      'en-IN': firstName ? `Hello ${firstName}! I'm CivicLens AI. How can I help?` : "Hello! I'm CivicLens AI. How can I help you today?",
      'hi-IN': firstName ? `Namaste ${firstName} ji! Kya madad chahiye?` : 'Namaste! Main CivicLens AI hun. Kya madad chahiye?',
      'pa-IN': 'Sat Sri Akal! Main CivicLens AI han.',
      'ta-IN': 'Vanakkam! Naan CivicLens AI.',
      'te-IN': 'Namaskaram! Nenu CivicLens AI.',
      'bn-IN': 'Nomoshkar! Ami CivicLens AI.',
      'gu-IN': 'Kem cho! Hu CivicLens AI chhu.',
      'kn-IN': 'Namaskara! Naanu CivicLens AI.',
      'ml-IN': 'Namaskaram! Njan CivicLens AI anu.',
      'mr-IN': 'Namaskar! Mi CivicLens AI aahe.',
    }
    const greeting = greetings[selectedLang] ?? greetings['en-IN']
    setTimeout(() => {
      setMessages([{ role: 'assistant', text: greeting, lang: selectedLang }])
      speak(greeting, selectedLang)
    }, 600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedLang])

  // ── UI state computations ─────────────────────────────────────────────────
  const firstName  = getFirstName(user?.name)
  const langDisp   = getLang(selectedLang)
  const activeDisp = getLang(activeLang)
  const headerBg   = isListening ? 'bg-red-600' : isSpeaking ? 'bg-emerald-600' : isThinking ? 'bg-amber-600' : 'bg-indigo-600'

  const flowLabel: Record<FlowState, string> = {
    idle: '', complaint_category: '📋 Step 1: Category',
    complaint_description: '📝 Step 2: Description',
    complaint_photo: '📷 Step 3: Photo',
    complaint_confirm: '✅ Step 4: Confirm',
  }

  // ── Floating button ───────────────────────────────────────────────────────
  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)}
      className="fixed bottom-24 left-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-all active:scale-95">
      <Mic className="w-6 h-6" />
    </button>
  )

  // ── Hands-free minimal bar ────────────────────────────────────────────────
  if (autoListen && !showChat) return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-md rounded-full border border-white/10 shadow-2xl max-w-sm">
      <div className={`w-2 h-2 rounded-full shrink-0 ${isListening ? 'bg-red-400 animate-pulse' : isSpeaking ? 'bg-emerald-400 animate-pulse' : isThinking ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
      <span className="text-white/80 text-xs truncate max-w-40">
        {transcript || (isThinking ? (THINKING_TEXTS[activeLang] ?? 'Thinking...') : statusText)}
      </span>
      <span className="text-white/40 text-[10px] shrink-0">{activeDisp.label}</span>
      <button onClick={isListening ? stopMic : startMic} disabled={isThinking || isSpeaking}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isListening ? 'bg-red-500' : 'bg-indigo-500'} disabled:opacity-40`}>
        {isListening ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-white" />}
      </button>
      <button onClick={() => setShowChat(true)} className="text-white/50 hover:text-white text-xs border border-white/20 px-2 py-1 rounded-full">chat</button>
      <button onClick={() => { setAutoListen(false); setShowChat(true); stopMic() }} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
    </div>
  )

  // ── Full chat panel ───────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-24 left-6 z-50 w-80 bg-[#0d1117] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>

      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${headerBg} transition-colors duration-300 shrink-0`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            {isListening ? <MicOff className="w-4 h-4 text-white" /> : isSpeaking ? <Volume2 className="w-4 h-4 text-white" /> : isThinking ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Mic className="w-4 h-4 text-white" />}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">CivicLens AI{firstName ? ` · ${firstName}` : ''}</p>
            <p className="text-white/70 text-xs">{translating ? '🌐 Translating...' : statusText}</p>
          </div>
        </div>
        <button onClick={handleClose} className="text-white/80 hover:text-white ml-2 shrink-0"><X className="w-5 h-5" /></button>
      </div>

      {/* Flow indicator */}
      {flowState !== 'idle' && (
        <div className="bg-indigo-900/40 px-4 py-1.5 text-xs text-indigo-300 font-medium border-b border-indigo-800/40 shrink-0">
          {flowLabel[flowState]}
        </div>
      )}

      {/* Language selector */}
      <div className="relative bg-slate-900 border-b border-slate-800 shrink-0">
        <button onClick={() => setShowLangPicker(p => !p)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Speak: <span className="text-indigo-400 font-medium">{langDisp.label}</span></span>
            {activeLang !== selectedLang && <span className="text-emerald-400">· Reply: {activeDisp.label}</span>}
            {HF_TOKEN && <span className="text-purple-400 text-[10px] bg-purple-900/30 px-1.5 py-0.5 rounded-full">HF</span>}
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
                  <span className="text-slate-500 text-[10px]">{l.hf}</span>
                  {l.code === selectedLang && <span className="text-indigo-500 text-[10px]">✓ selected</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 px-4 py-2 text-xs text-red-200 border-b border-red-800 flex items-center justify-between gap-2 shrink-0">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
              {msg.text.replace(/\[.*?\]/g, '').trim()}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{translating ? '🌐 Translating...' : (THINKING_TEXTS[activeLang] ?? 'Thinking...')}</span>
            </div>
          </div>
        )}

        {transcript && (
          <div className="flex justify-end">
            <div className="max-w-[88%] px-4 py-2 rounded-2xl bg-indigo-900/40 text-sm italic text-indigo-300">{transcript}</div>
          </div>
        )}

        {/* Complaint progress indicator */}
        {complaintData.category && (
          <div className="bg-slate-800/60 rounded-xl p-3 text-xs space-y-1 border border-slate-700">
            <p className="text-slate-400 font-medium">📋 Complaint in progress</p>
            {complaintData.category    && <p className="text-slate-300">Category: <span className="text-indigo-400">{complaintData.category}</span></p>}
            {complaintData.description && <p className="text-slate-300">Description: <span className="text-slate-200">{complaintData.description.substring(0, 60)}{complaintData.description.length > 60 ? '...' : ''}</span></p>}
            {complaintData.photoTaken  && <p className="text-emerald-400">✓ Photo added</p>}
          </div>
        )}

        {/* Photo button */}
        {showPhotoBtn && (
          <div className="flex flex-col items-center gap-2 py-3">
            <label htmlFor="civic-photo-input"
              className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95 transition-all shadow-lg shadow-emerald-900/40">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold">{activeLang === 'en-IN' ? 'CAMERA' : 'फोटो'}</span>
              <span className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-40" />
            </label>
            <p className="text-slate-400 text-xs text-center">
              {activeLang === 'en-IN' ? 'Tap to take photo' : 'फोटो लेने के लिए टैप करें'}
            </p>
          </div>
        )}

        {/* Photo preview */}
        {photoPreview && (
          <div className="flex justify-center">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="complaint" className="w-32 h-32 object-cover rounded-xl border-2 border-emerald-500 shadow-lg" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </div>
        )}

        <input ref={photoInputRef} id="civic-photo-input" type="file" accept="image/*" capture={"environment" as any} className="hidden" onChange={handlePhotoSelected} />
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-slate-700 bg-slate-950 shrink-0">
        <div className="flex justify-center items-center gap-6 mb-4">
          {/* Stop speaking */}
          <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false) }}
            className="w-11 h-11 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
            title="Stop speaking">
            <Volume2 className="w-5 h-5 text-slate-300" />
          </button>

          {/* Main mic button */}
          <button onClick={isListening ? stopMic : startMic} disabled={isThinking || isSpeaking}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${isListening ? 'bg-red-600 scale-110 ring-4 ring-red-400/30 shadow-red-900/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'} disabled:opacity-40 disabled:cursor-not-allowed`}>
            {isListening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
          </button>

          {/* Reset */}
          <button onClick={resetConversation}
            className="w-11 h-11 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
            title="Reset conversation">
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
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${autoListen ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
            {autoListen ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* LangChain + HF badges */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">LangChain</span>
          {HF_TOKEN && <span className="text-[10px] text-purple-500 bg-purple-900/20 px-2 py-0.5 rounded-full">HuggingFace MT</span>}
          <span className="text-[10px] text-orange-500 bg-orange-900/20 px-2 py-0.5 rounded-full">Groq LLaMA</span>
        </div>
      </div>
    </div>
  )
}