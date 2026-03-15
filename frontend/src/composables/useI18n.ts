import { computed, ref } from 'vue'

export type Lang = 'th' | 'en'

const STORAGE_KEY = 'smart_vote_lang'

function detectLang (): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'th' || saved === 'en') return saved
  const browser = navigator.language.toLowerCase()
  return browser.startsWith('th') ? 'th' : 'en'
}

// Singleton reactive lang state
const lang = ref<Lang>('th')

// Lazy init (called once by first consumer)
let initialised = false
function ensureInit () {
  if (!initialised && typeof window !== 'undefined') {
    lang.value = detectLang()
    initialised = true
  }
}

export function useI18n () {
  ensureInit()

  function setLang (l: Lang) {
    lang.value = l
    localStorage.setItem(STORAGE_KEY, l)
  }

  function toggleLang () {
    setLang(lang.value === 'th' ? 'en' : 'th')
  }

  const t = computed(() => (lang.value === 'th' ? TH : EN))

  return { lang, t, setLang, toggleLang }
}

// ── Translations ──────────────────────────────────────────────────────────────

const TH = {
  // App
  appName: 'Smart Vote',
  tagline: 'ระบบโหวตอัจฉริยะแบบ Realtime',

  // Home form
  question: 'คำถาม / หัวข้อโหวต',
  questionPlaceholder: 'เช่น วันไหนที่สะดวกประชุม?',
  description: 'คำอธิบาย (ไม่บังคับ)',
  descriptionPlaceholder: 'รายละเอียดเพิ่มเติม...',
  voteType: 'รูปแบบโหวต',
  resultMode: 'โหมดแสดงผล',
  maxSelections: 'จำนวนสูงสุดที่เลือกได้',
  maxSelectionsHint: 'เว้นว่างหากไม่จำกัด',
  options: 'ตัวเลือก',
  optionsHint: '(ขั้นต่ำ 2 ข้อ)',
  optionPlaceholder: (i: number) => `ตัวเลือกที่ ${i + 1}`,
  optionDatetimePlaceholder: 'เช่น 2026-03-20 09:00',
  optionTimePlaceholder: 'เช่น 09:00 น.',
  addOption: 'เพิ่มตัวเลือก',
  allowAddOptions: 'เปิดให้ผู้โหวตเพิ่มตัวเลือกได้',
  allowAddOptionsHint: 'ผู้เข้าร่วมสามารถเสนอตัวเลือกใหม่ระหว่างการโหวต',
  requireVoterName: '🎭 ให้ผู้โหวตตั้งชื่อและเลือก Avatar',
  requireVoterNameHint: 'ผู้เข้าร่วมต้องระบุชื่อและเลือก Avatar ก่อนโหวต',
  showVoterName: '📛 แสดงชื่อผู้โหวตในผลลัพธ์',
  showVoterNameHint: 'ปิด = แสดงเฉพาะ Avatar (ค่าเริ่มต้น)',
  createVote: 'สร้างโหวต',
  creating: 'กำลังสร้าง...',
  createSuccess: 'สร้างโหวตสำเร็จ!',
  createError: (msg: string) => `เกิดข้อผิดพลาด: ${msg}`,
  required: '*',

  // Template download
  downloadTemplate: 'ดาวน์โหลดตัวอย่าง',
  downloadCSV: 'ตัวอย่าง CSV',
  downloadExcel: 'ตัวอย่าง Excel',
  importOptions: 'นำเข้า',
  exportCSV: 'ส่งออก CSV',

  // Vote types
  voteTypes: {
    single: { label: 'เลือกได้ 1 ข้อ', desc: 'ผู้โหวตเลือกได้เพียง 1 ตัวเลือก' },
    multiple: { label: 'เลือกได้หลายข้อ', desc: 'ผู้โหวตเลือกได้มากกว่า 1 ตัวเลือก' },
    datetime: { label: 'วัน เวลา', desc: 'ตัวเลือกเป็นวันและเวลา' },
    time: { label: 'เวลา', desc: 'ตัวเลือกเป็นเวลาเท่านั้น' },
  },

  // Result modes
  resultModes: {
    show_immediately: { label: 'แสดงผลเลย', desc: 'ทุกคนเห็นผลโหวตแบบ Realtime ตลอดเวลา' },
    after_vote: { label: 'โหวตก่อน แล้วแสดงผล', desc: 'เห็นผลได้หลังจากโหวตเสร็จเท่านั้น' },
    after_close: { label: 'ปิดโหวตก่อนแสดงผล', desc: 'เห็นผลได้หลัง Admin ปิดการโหวต' },
  },

  // VoteView
  votes: (n: number) => `${n} โหวต`,
  expires: 'หมดอายุ',
  voteCast: 'โหวตสำเร็จ! 🎉',
  alreadyVoted: 'คุณโหวตแล้ว',
  alreadyVotedHint: 'ดูผลลัพธ์ด้านล่างแบบ Realtime',
  sessionClosed: 'การโหวตถูกปิดแล้ว',
  sessionClosedLabel: 'ปิดโหวตแล้ว',
  sessionReopened: 'การโหวตเปิดใหม่แล้ว',
  confirmVote: 'ยืนยันโหวต',
  sending: '⏳ กำลังส่ง...',
  submitOption: 'เพิ่ม',
  proposeOption: 'เสนอตัวเลือกเพิ่มเติม',
  proposeOptionPlaceholder: 'พิมพ์ตัวเลือกใหม่...',
  changeProfile: 'เปลี่ยน',
  voteNowToSeeResults: 'โหวตก่อนเพื่อดูผลลัพธ์',
  waitForClose: 'รอ Admin ปิดการโหวตก่อนดูผล',
  shareVote: 'แชร์ลิงก์โหวต',

  // Result mode badges
  modeBadges: {
    show_immediately: 'แสดงผลเลย',
    after_vote: 'โหวตก่อน แล้วแสดงผล',
    after_close: 'ปิดโหวตก่อนแสดงผล',
  },

  // Admin
  admin: 'Admin',
  sessionInfo: 'ข้อมูล Session',
  totalVotes: 'โหวตทั้งหมด',
  optionsCount: 'ตัวเลือก',
  status: 'สถานะ',
  statusActive: 'กำลังโหวต',
  statusClosed: 'ปิดแล้ว',
  controls: 'ควบคุม',
  closeVoting: '🔒 ปิดการโหวต',
  reopenVoting: '🔓 เปิดการโหวตอีกครั้ง',
  resultModeLabel: 'โหมดแสดงผล',
  addOptionLabel: 'เพิ่มตัวเลือก',
  addOptionPlaceholder: 'ชื่อตัวเลือกใหม่...',
  exportResults: 'Export ผลโหวต',
  shareVoteLink: 'ลิงก์โหวตสำหรับแชร์',
  shareAdminLink: 'ลิงก์ Admin (เก็บเป็นความลับ!)',
  dangerZone: '⚠️ Danger Zone',
  deleteSession: '🗑️ ลบ session นี้',
  confirmDelete: '⚠️ ยืนยัน: ลบ session นี้จริงๆ?',
  confirmDeleteHint: 'คลิกอีกครั้งเพื่อยืนยัน หรือรอ 5 วินาทีเพื่อยกเลิก',
  noPermission: 'ไม่มีสิทธิ์เข้าหน้า Admin',
  deleted: 'ลบ session แล้ว',
  newOptionAdded: (label: string) => `ตัวเลือกใหม่: "${label}"`,

  // Connection
  connected: 'เชื่อมต่อแล้ว',
  connecting: 'กำลังเชื่อมต่อ...',
  disconnected: 'ขาดการเชื่อมต่อ',

  // Loading / error
  loading: 'กำลังโหลด...',
  notFound: 'ไม่พบ Session',
  error: 'เกิดข้อผิดพลาด',
  importSuccess: (n: number) => `นำเข้า ${n} ตัวเลือกสำเร็จ`,
  importEmpty: 'ไม่พบตัวเลือกในไฟล์',
  importUnsupported: 'รองรับเฉพาะ .csv, .txt, .xlsx, .xls',
  importExcelError: 'ไม่สามารถอ่านไฟล์ Excel ได้',
  noOptions: 'ยังไม่มีตัวเลือก',
  noResults: 'ยังไม่มีผลโหวต',

  // Help & About
  helpTitle: 'คู่มือการใช้งาน',
  helpClose: 'ปิด',
  helpSections: [
    {
      icon: '🗳️',
      title: 'สร้างโหวต',
      steps: [
        'ตั้งคำถามและคำอธิบาย (ไม่บังคับ)',
        'เลือกรูปแบบโหวต: เลือก 1 ข้อ / หลายข้อ / วันเวลา / เวลา',
        'เลือกโหมดแสดงผล: แบบ Realtime / โหวตก่อนดูผล / ปิดโหวตก่อนดูผล',
        'เพิ่มตัวเลือก (พิมพ์เอง หรือนำเข้าจาก CSV / Excel)',
        'กด "สร้างโหวต" แล้วแชร์ลิงก์โหวตให้ผู้เข้าร่วม',
      ],
    },
    {
      icon: '📤',
      title: 'นำเข้าตัวเลือกจากไฟล์',
      steps: [
        'ดาวน์โหลดไฟล์ตัวอย่าง CSV หรือ Excel ก่อน',
        'แก้ไขตัวเลือกในไฟล์ (หนึ่งบรรทัดต่อหนึ่งตัวเลือก)',
        'กดปุ่ม ⬆️ นำเข้า แล้วเลือกไฟล์',
        'รองรับ .csv, .txt, .xlsx, .xls',
      ],
    },
    {
      icon: '📊',
      title: 'โหมดแสดงผล',
      steps: [
        '📊 แสดงผลเลย — ทุกคนเห็นผลแบบ Realtime ตลอดเวลา',
        '🗳️ โหวตก่อน แล้วแสดงผล — เห็นผลได้หลังโหวตเสร็จ',
        '🔒 ปิดโหวตก่อนแสดงผล — เห็นผลได้หลัง Admin ปิดการโหวต',
      ],
    },
    {
      icon: '🔑',
      title: 'ลิงก์ Admin',
      steps: [
        'หลังสร้างโหวต คุณจะได้รับลิงก์ Admin อัตโนมัติ',
        'ใช้ลิงก์ Admin เพื่อเปิด/ปิดโหวต เพิ่มตัวเลือก และลบ session',
        'เก็บลิงก์ Admin เป็นความลับ ห้ามแชร์ให้ผู้โหวต',
        'ลิงก์โหวตทั่วไปใช้แชร์สาธารณะได้อย่างปลอดภัย',
      ],
    },
  ] as { icon: string; title: string; steps: string[] }[],

  aboutTitle: 'เกี่ยวกับ Smart Vote',
  aboutTagline: 'ระบบโหวตอัจฉริยะแบบ Realtime',
  aboutDesc: 'Smart Vote เป็นระบบโหวตออนไลน์แบบ Realtime ที่ใช้งานง่าย รองรับการโหวตหลายรูปแบบ แสดงผล Live Chart และรองรับผู้ใช้พร้อมกันหลายคน',
  aboutBuiltWith: 'เทคโนโลยีที่ใช้',
  aboutStack: [
    { icon: '⚡', name: 'Cloudflare Workers + Durable Objects', desc: 'Backend + Realtime WebSocket' },
    { icon: '🗄️', name: 'Cloudflare D1', desc: 'Database (SQLite)' },
    { icon: '💚', name: 'Vue 3 + TypeScript', desc: 'Frontend Framework' },
    { icon: '🎨', name: 'Tailwind CSS v4', desc: 'Styling' },
    { icon: '⚡', name: 'Vite', desc: 'Build Tool' },
  ] as { icon: string; name: string; desc: string }[],
  aboutAI: 'พัฒนาด้วย AI 100%',
  aboutAIDesc: 'โปรเจกต์นี้พัฒนาโดย AI (GitHub Copilot / Claude) ทั้งหมด ตามคำร้องขอของ',
  aboutAuthor: 'MrChoke',
  aboutVersion: 'เวอร์ชัน',
} as const

const EN = {
  // App
  appName: 'Smart Vote',
  tagline: 'Real-time Smart Voting System',

  // Home form
  question: 'Question / Poll Topic',
  questionPlaceholder: 'e.g. Which day works best for a meeting?',
  description: 'Description (optional)',
  descriptionPlaceholder: 'Additional details...',
  voteType: 'Vote Type',
  resultMode: 'Result Mode',
  maxSelections: 'Maximum selections',
  maxSelectionsHint: 'Leave blank for unlimited',
  options: 'Options',
  optionsHint: '(minimum 2)',
  optionPlaceholder: (i: number) => `Option ${i + 1}`,
  optionDatetimePlaceholder: 'e.g. 2026-03-20 09:00',
  optionTimePlaceholder: 'e.g. 09:00',
  addOption: 'Add Option',
  allowAddOptions: 'Allow voters to add options',
  allowAddOptionsHint: 'Participants can suggest new options during the vote',
  requireVoterName: '🎭 Require voter name & Avatar',
  requireVoterNameHint: 'Participants must set a name and avatar before voting',
  showVoterName: '📛 Show voter names in results',
  showVoterNameHint: 'Off = show Avatar only (default)',
  createVote: 'Create Vote',
  creating: 'Creating...',
  createSuccess: 'Vote created successfully!',
  createError: (msg: string) => `Error: ${msg}`,
  required: '*',

  // Template download
  downloadTemplate: 'Download Template',
  downloadCSV: 'CSV Template',
  downloadExcel: 'Excel Template',
  importOptions: 'Import',
  exportCSV: 'Export CSV',

  // Vote types
  voteTypes: {
    single: { label: 'Single choice', desc: 'Voters can pick exactly one option' },
    multiple: { label: 'Multiple choice', desc: 'Voters can pick more than one option' },
    datetime: { label: 'Date & Time', desc: 'Options are date-time values' },
    time: { label: 'Time only', desc: 'Options are time values' },
  },

  // Result modes
  resultModes: {
    show_immediately: { label: 'Show results immediately', desc: 'Everyone sees results in real-time' },
    after_vote: { label: 'Vote first, then show results', desc: 'Results visible only after voting' },
    after_close: { label: 'Show after closing', desc: 'Results visible only after admin closes the poll' },
  },

  // VoteView
  votes: (n: number) => `${n} vote${n !== 1 ? 's' : ''}`,
  expires: 'Expires',
  voteCast: 'Vote cast! 🎉',
  alreadyVoted: 'You have voted',
  alreadyVotedHint: 'See live results below',
  sessionClosed: 'Voting has been closed',
  sessionClosedLabel: 'Closed',
  sessionReopened: 'Voting has been reopened',
  confirmVote: 'Confirm Vote',
  sending: '⏳ Sending...',
  submitOption: 'Add',
  proposeOption: 'Suggest a new option',
  proposeOptionPlaceholder: 'Type a new option...',
  changeProfile: 'Change',
  voteNowToSeeResults: 'Cast your vote to see results',
  waitForClose: 'Results will be shown after the poll closes',
  shareVote: 'Share vote link',

  // Result mode badges
  modeBadges: {
    show_immediately: 'Show immediately',
    after_vote: 'After vote',
    after_close: 'After close',
  },

  // Admin
  admin: 'Admin',
  sessionInfo: 'Session Info',
  totalVotes: 'Total Votes',
  optionsCount: 'Options',
  status: 'Status',
  statusActive: 'Active',
  statusClosed: 'Closed',
  controls: 'Controls',
  closeVoting: '🔒 Close Voting',
  reopenVoting: '🔓 Reopen Voting',
  resultModeLabel: 'Result Mode',
  addOptionLabel: 'Add Option',
  addOptionPlaceholder: 'New option label...',
  exportResults: 'Export Results',
  shareVoteLink: 'Share link for voters',
  shareAdminLink: 'Admin link (keep secret!)',
  dangerZone: '⚠️ Danger Zone',
  deleteSession: '🗑️ Delete this session',
  confirmDelete: '⚠️ Confirm: really delete this session?',
  confirmDeleteHint: 'Click again to confirm, or wait 5 seconds to cancel',
  noPermission: 'You do not have admin access',
  deleted: 'Session deleted',
  newOptionAdded: (label: string) => `New option: "${label}"`,

  // Connection
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Disconnected',

  // Loading / error
  loading: 'Loading...',
  notFound: 'Session not found',
  error: 'An error occurred',
  importSuccess: (n: number) => `Imported ${n} option${n !== 1 ? 's' : ''} successfully`,
  importEmpty: 'No options found in file',
  importUnsupported: 'Only .csv, .txt, .xlsx, .xls are supported',
  importExcelError: 'Could not read Excel file',
  noOptions: 'No options yet',
  noResults: 'No votes yet',

  // Help & About
  helpTitle: 'User Guide',
  helpClose: 'Close',
  helpSections: [
    {
      icon: '🗳️',
      title: 'Create a Vote',
      steps: [
        'Set a question and optional description',
        'Choose vote type: single / multiple / date-time / time',
        'Choose result mode: real-time / vote first / close first',
        'Add options (type manually or import from CSV / Excel)',
        'Click "Create Vote" and share the vote link with participants',
      ],
    },
    {
      icon: '📤',
      title: 'Import Options from File',
      steps: [
        'Download the CSV or Excel template first',
        'Edit your options in the file (one option per line)',
        'Click ⬆️ Import and select your file',
        'Supported formats: .csv, .txt, .xlsx, .xls',
      ],
    },
    {
      icon: '📊',
      title: 'Result Modes',
      steps: [
        '📊 Show immediately — everyone sees results in real-time',
        '🗳️ Vote first, then show — results visible only after voting',
        '🔒 Show after close — results visible only after admin closes the poll',
      ],
    },
    {
      icon: '🔑',
      title: 'Admin Link',
      steps: [
        'After creating a vote, you receive an Admin link automatically',
        'Use the Admin link to open/close voting, add options, or delete the session',
        'Keep the Admin link secret — never share it with voters',
        'The regular vote link is safe to share publicly',
      ],
    },
  ] as { icon: string; title: string; steps: string[] }[],

  aboutTitle: 'About Smart Vote',
  aboutTagline: 'Real-time Smart Voting System',
  aboutDesc: 'Smart Vote is an easy-to-use real-time online voting system supporting multiple vote types, live bar chart results, and concurrent multi-user voting.',
  aboutBuiltWith: 'Built With',
  aboutStack: [
    { icon: '⚡', name: 'Cloudflare Workers + Durable Objects', desc: 'Backend + Realtime WebSocket' },
    { icon: '🗄️', name: 'Cloudflare D1', desc: 'Database (SQLite)' },
    { icon: '💚', name: 'Vue 3 + TypeScript', desc: 'Frontend Framework' },
    { icon: '🎨', name: 'Tailwind CSS v4', desc: 'Styling' },
    { icon: '⚡', name: 'Vite', desc: 'Build Tool' },
  ] as { icon: string; name: string; desc: string }[],
  aboutAI: '100% AI-Built',
  aboutAIDesc: 'This project was developed entirely by AI (GitHub Copilot / Claude) at the request of',
  aboutAuthor: 'MrChoke',
  aboutVersion: 'Version',
} as const

export type Translations = typeof TH
