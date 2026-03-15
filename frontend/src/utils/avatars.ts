export interface Avatar {
  id: number
  name: string
  emoji: string
  svg: string
}

export const AVATARS: Avatar[] = [
  {
    id: 1,
    name: 'แมว',
    emoji: '🐱',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='44' r='36' fill='#FF9A3C'/>
  <polygon points='10,36 20,8 32,32' fill='#FF9A3C'/>
  <polygon points='13,35 21,12 29,31' fill='#FFB8A0'/>
  <polygon points='70,36 60,8 48,32' fill='#FF9A3C'/>
  <polygon points='67,35 59,12 51,31' fill='#FFB8A0'/>
  <circle cx='40' cy='46' r='28' fill='#FFB870'/>
  <ellipse cx='28' cy='41' rx='4' ry='5' fill='#1a0a00'/>
  <ellipse cx='52' cy='41' rx='4' ry='5' fill='#1a0a00'/>
  <circle cx='29.5' cy='39' r='1.5' fill='white'/>
  <circle cx='53.5' cy='39' r='1.5' fill='white'/>
  <ellipse cx='40' cy='50' rx='3' ry='2' fill='#FF6B9D'/>
  <path d='M37,52 Q40,56 43,52' stroke='#1a0a00' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <line x1='16' y1='47' x2='34' y2='49' stroke='#1a0a00' stroke-width='1' opacity='0.4'/>
  <line x1='16' y1='51' x2='34' y2='50' stroke='#1a0a00' stroke-width='1' opacity='0.4'/>
  <line x1='46' y1='49' x2='64' y2='47' stroke='#1a0a00' stroke-width='1' opacity='0.4'/>
  <line x1='46' y1='50' x2='64' y2='51' stroke='#1a0a00' stroke-width='1' opacity='0.4'/>
</svg>`,
  },
  {
    id: 2,
    name: 'สุนัข',
    emoji: '🐶',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='40' r='36' fill='#C4843A'/>
  <ellipse cx='15' cy='48' rx='11' ry='17' fill='#A0682A' transform='rotate(-15 15 48)'/>
  <ellipse cx='65' cy='48' rx='11' ry='17' fill='#A0682A' transform='rotate(15 65 48)'/>
  <ellipse cx='15' cy='49' rx='7' ry='12' fill='#C4843A' transform='rotate(-15 15 49)'/>
  <ellipse cx='65' cy='49' rx='7' ry='12' fill='#C4843A' transform='rotate(15 65 49)'/>
  <ellipse cx='40' cy='50' rx='17' ry='12' fill='#E8B870'/>
  <circle cx='29' cy='36' r='5' fill='white'/>
  <circle cx='51' cy='36' r='5' fill='white'/>
  <circle cx='30' cy='37' r='3.5' fill='#2a1a00'/>
  <circle cx='52' cy='37' r='3.5' fill='#2a1a00'/>
  <circle cx='31.5' cy='35.5' r='1.2' fill='white'/>
  <circle cx='53.5' cy='35.5' r='1.2' fill='white'/>
  <ellipse cx='40' cy='46' rx='5' ry='3.5' fill='#1a0a00'/>
  <ellipse cx='40' cy='57' rx='5' ry='6' fill='#FF6B9D'/>
  <line x1='40' y1='51' x2='40' y2='60' stroke='#E85090' stroke-width='1.5'/>
</svg>`,
  },
  {
    id: 3,
    name: 'กระต่าย',
    emoji: '🐰',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <ellipse cx='27' cy='18' rx='8' ry='20' fill='#C0B8D8'/>
  <ellipse cx='53' cy='18' rx='8' ry='20' fill='#C0B8D8'/>
  <ellipse cx='27' cy='18' rx='4' ry='15' fill='#FFB8C8'/>
  <ellipse cx='53' cy='18' rx='4' ry='15' fill='#FFB8C8'/>
  <circle cx='40' cy='48' r='30' fill='#DCD8F0'/>
  <circle cx='24' cy='54' r='8' fill='#FFB8C8' opacity='0.5'/>
  <circle cx='56' cy='54' r='8' fill='#FFB8C8' opacity='0.5'/>
  <circle cx='29' cy='44' r='5.5' fill='white'/>
  <circle cx='51' cy='44' r='5.5' fill='white'/>
  <circle cx='30' cy='44' r='3.5' fill='#FF69B4'/>
  <circle cx='52' cy='44' r='3.5' fill='#FF69B4'/>
  <circle cx='31' cy='42.5' r='1.2' fill='white'/>
  <circle cx='53' cy='42.5' r='1.2' fill='white'/>
  <ellipse cx='40' cy='53' rx='3' ry='2' fill='#FF69B4'/>
  <line x1='40' y1='53' x2='40' y2='56' stroke='#C8A0B8' stroke-width='1.5'/>
  <path d='M36,56 Q40,59 44,56' stroke='#C8A0B8' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 4,
    name: 'หมี',
    emoji: '🐻',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='18' cy='22' r='14' fill='#6B4226'/>
  <circle cx='62' cy='22' r='14' fill='#6B4226'/>
  <circle cx='18' cy='22' r='9' fill='#8B5E3C'/>
  <circle cx='62' cy='22' r='9' fill='#8B5E3C'/>
  <circle cx='40' cy='44' r='32' fill='#8B5E3C'/>
  <ellipse cx='40' cy='54' rx='16' ry='11' fill='#C4956A'/>
  <circle cx='28' cy='38' r='5' fill='#1a0a00'/>
  <circle cx='52' cy='38' r='5' fill='#1a0a00'/>
  <circle cx='29.5' cy='36.5' r='1.5' fill='white'/>
  <circle cx='53.5' cy='36.5' r='1.5' fill='white'/>
  <ellipse cx='40' cy='49' rx='5' ry='3.5' fill='#1a0a00'/>
  <path d='M35,53 Q37,57 40,56 Q43,57 45,53' stroke='#6B4226' stroke-width='2' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 5,
    name: 'จิ้งจอก',
    emoji: '🦊',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <polygon points='14,36 22,4 34,32' fill='#D44E14'/>
  <polygon points='17,34 23,8 31,31' fill='#F5E8DC'/>
  <polygon points='66,36 58,4 46,32' fill='#D44E14'/>
  <polygon points='63,34 57,8 49,31' fill='#F5E8DC'/>
  <circle cx='40' cy='46' r='32' fill='#E8622A'/>
  <ellipse cx='40' cy='54' rx='20' ry='14' fill='#F5E8DC'/>
  <circle cx='27' cy='39' r='6' fill='#2a1200'/>
  <circle cx='53' cy='39' r='6' fill='#2a1200'/>
  <circle cx='25.5' cy='37' r='2' fill='white'/>
  <circle cx='51.5' cy='37' r='2' fill='white'/>
  <ellipse cx='40' cy='50' rx='4' ry='2.5' fill='#1a0a00'/>
  <path d='M36,53 Q38,56 40,55 Q42,56 44,53' stroke='#1a0a00' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 6,
    name: 'สิงห์โต',
    emoji: '🦁',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='44' r='38' fill='#C48C10'/>
  <circle cx='40' cy='42' r='28' fill='#E8B830'/>
  <circle cx='18' cy='18' r='8' fill='#E8B830'/>
  <circle cx='62' cy='18' r='8' fill='#E8B830'/>
  <ellipse cx='40' cy='52' rx='14' ry='10' fill='#F5D060'/>
  <circle cx='29' cy='38' r='5' fill='white'/>
  <circle cx='51' cy='38' r='5' fill='white'/>
  <circle cx='30' cy='39' r='3.5' fill='#8B5010'/>
  <circle cx='52' cy='39' r='3.5' fill='#8B5010'/>
  <circle cx='31' cy='37.5' r='1' fill='#1a0a00'/>
  <circle cx='53' cy='37.5' r='1' fill='#1a0a00'/>
  <circle cx='31.5' cy='37' r='0.7' fill='white'/>
  <circle cx='53.5' cy='37' r='0.7' fill='white'/>
  <ellipse cx='40' cy='48' rx='4' ry='2.5' fill='#C05020'/>
  <path d='M36,51 Q38,55 40,54 Q42,55 44,51' stroke='#C05020' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 7,
    name: 'เสือ',
    emoji: '🐯',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='42' r='36' fill='#E86410'/>
  <circle cx='18' cy='18' r='10' fill='#E86410'/>
  <circle cx='18' cy='18' r='5' fill='#FFB870'/>
  <circle cx='62' cy='18' r='10' fill='#E86410'/>
  <circle cx='62' cy='18' r='5' fill='#FFB870'/>
  <ellipse cx='40' cy='52' rx='22' ry='15' fill='#F5E8DC'/>
  <path d='M35,14 Q40,20 45,14' stroke='#1a0a00' stroke-width='3' fill='none' stroke-linecap='round'/>
  <path d='M28,22 Q32,28 28,34' stroke='#1a0a00' stroke-width='2.5' fill='none' stroke-linecap='round'/>
  <path d='M52,22 Q48,28 52,34' stroke='#1a0a00' stroke-width='2.5' fill='none' stroke-linecap='round'/>
  <circle cx='29' cy='38' r='6' fill='#2a8010'/>
  <circle cx='51' cy='38' r='6' fill='#2a8010'/>
  <ellipse cx='29' cy='38' rx='2' ry='4.5' fill='#1a0a00'/>
  <ellipse cx='51' cy='38' rx='2' ry='4.5' fill='#1a0a00'/>
  <circle cx='30.5' cy='36.5' r='1.2' fill='white'/>
  <circle cx='52.5' cy='36.5' r='1.2' fill='white'/>
  <ellipse cx='40' cy='49' rx='4.5' ry='3' fill='#1a0a00'/>
  <path d='M35,52 Q37,56 40,55 Q43,56 45,52' stroke='#1a0a00' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 8,
    name: 'ช้าง',
    emoji: '🐘',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <ellipse cx='11' cy='42' rx='14' ry='18' fill='#7B9EA6'/>
  <ellipse cx='69' cy='42' rx='14' ry='18' fill='#7B9EA6'/>
  <ellipse cx='11' cy='43' rx='9' ry='13' fill='#9EC4CC'/>
  <ellipse cx='69' cy='43' rx='9' ry='13' fill='#9EC4CC'/>
  <circle cx='40' cy='38' r='28' fill='#8AB4BA'/>
  <path d='M32,60 Q28,70 34,76 Q41,80 40,70 Q38,62 40,58' fill='#8AB4BA'/>
  <circle cx='28' cy='32' r='5' fill='white'/>
  <circle cx='52' cy='32' r='5' fill='white'/>
  <circle cx='29' cy='33' r='3.5' fill='#1a0a00'/>
  <circle cx='53' cy='33' r='3.5' fill='#1a0a00'/>
  <circle cx='30.5' cy='31.5' r='1.2' fill='white'/>
  <circle cx='54.5' cy='31.5' r='1.2' fill='white'/>
  <path d='M33,52 Q28,58 24,56' stroke='#F5F0E0' stroke-width='3' fill='none' stroke-linecap='round'/>
  <path d='M47,52 Q52,58 56,56' stroke='#F5F0E0' stroke-width='3' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 9,
    name: 'เพนกวิน',
    emoji: '🐧',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='40' r='36' fill='#2D3748'/>
  <ellipse cx='40' cy='48' rx='20' ry='25' fill='#F7F7F7'/>
  <circle cx='29' cy='36' r='6' fill='white'/>
  <circle cx='51' cy='36' r='6' fill='white'/>
  <circle cx='30' cy='37' r='4' fill='#1a0a00'/>
  <circle cx='52' cy='37' r='4' fill='#1a0a00'/>
  <circle cx='31.5' cy='35.5' r='1.5' fill='white'/>
  <circle cx='53.5' cy='35.5' r='1.5' fill='white'/>
  <polygon points='40,45 35,52 45,52' fill='#FF8C00'/>
  <ellipse cx='40' cy='64' rx='13' ry='9' fill='#E8E8E8'/>
</svg>`,
  },
  {
    id: 10,
    name: 'นกฮูก',
    emoji: '🦉',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='44' r='34' fill='#7B5A1E'/>
  <polygon points='23,16 26,5 34,20' fill='#7B5A1E'/>
  <polygon points='57,16 54,5 46,20' fill='#7B5A1E'/>
  <ellipse cx='40' cy='46' rx='24' ry='22' fill='#C4A460'/>
  <circle cx='27' cy='38' r='11' fill='#F5E842'/>
  <circle cx='53' cy='38' r='11' fill='#F5E842'/>
  <circle cx='27' cy='38' r='7' fill='#1a5000'/>
  <circle cx='53' cy='38' r='7' fill='#1a5000'/>
  <circle cx='27' cy='38' r='4' fill='#0a0a0a'/>
  <circle cx='53' cy='38' r='4' fill='#0a0a0a'/>
  <circle cx='29' cy='36' r='2' fill='white'/>
  <circle cx='55' cy='36' r='2' fill='white'/>
  <polygon points='40,46 36,53 44,53' fill='#E87010'/>
</svg>`,
  },
  {
    id: 11,
    name: 'กบ',
    emoji: '🐸',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='48' r='32' fill='#4CAF50'/>
  <circle cx='23' cy='22' r='13' fill='#4CAF50'/>
  <circle cx='57' cy='22' r='13' fill='#4CAF50'/>
  <circle cx='23' cy='22' r='9' fill='#F0F0F0'/>
  <circle cx='57' cy='22' r='9' fill='#F0F0F0'/>
  <circle cx='24' cy='23' r='6' fill='#1a4a00'/>
  <circle cx='58' cy='23' r='6' fill='#1a4a00'/>
  <circle cx='26' cy='21' r='2.5' fill='white'/>
  <circle cx='60' cy='21' r='2.5' fill='white'/>
  <circle cx='36' cy='40' r='2' fill='#388E3C'/>
  <circle cx='44' cy='40' r='2' fill='#388E3C'/>
  <path d='M20,54 Q30,65 40,65 Q50,65 60,54' stroke='#1a4a00' stroke-width='3' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 12,
    name: 'แพนด้า',
    emoji: '🐼',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='42' r='36' fill='#F0F0F0'/>
  <circle cx='16' cy='18' r='12' fill='#1a1a1a'/>
  <circle cx='64' cy='18' r='12' fill='#1a1a1a'/>
  <ellipse cx='27' cy='36' rx='9' ry='8' fill='#1a1a1a'/>
  <ellipse cx='53' cy='36' rx='9' ry='8' fill='#1a1a1a'/>
  <circle cx='27' cy='37' r='5' fill='white'/>
  <circle cx='53' cy='37' r='5' fill='white'/>
  <circle cx='28' cy='38' r='3' fill='#1a0a00'/>
  <circle cx='54' cy='38' r='3' fill='#1a0a00'/>
  <circle cx='29.5' cy='36.5' r='1.2' fill='white'/>
  <circle cx='55.5' cy='36.5' r='1.2' fill='white'/>
  <ellipse cx='40' cy='52' rx='13' ry='9' fill='#F5F5F5'/>
  <ellipse cx='40' cy='48' rx='4' ry='2.5' fill='#1a0a00'/>
  <path d='M36,52 Q38,56 40,55 Q42,56 44,52' stroke='#888' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 13,
    name: 'หมาป่า',
    emoji: '🐺',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='44' r='34' fill='#6B7A8D'/>
  <polygon points='14,36 20,8 32,32' fill='#6B7A8D'/>
  <polygon points='17,35 21,11 29,31' fill='#9AAABB'/>
  <polygon points='66,36 60,8 48,32' fill='#6B7A8D'/>
  <polygon points='63,35 59,11 51,31' fill='#9AAABB'/>
  <ellipse cx='40' cy='54' rx='18' ry='13' fill='#9AAABB'/>
  <circle cx='27' cy='38' r='5.5' fill='#E8D840'/>
  <circle cx='53' cy='38' r='5.5' fill='#E8D840'/>
  <ellipse cx='27' cy='38' rx='2' ry='4' fill='#1a0a00'/>
  <ellipse cx='53' cy='38' rx='2' ry='4' fill='#1a0a00'/>
  <circle cx='28.5' cy='36.5' r='1.2' fill='white'/>
  <circle cx='54.5' cy='36.5' r='1.2' fill='white'/>
  <ellipse cx='40' cy='49' rx='4' ry='2.5' fill='#1a0a00'/>
  <path d='M36,52 Q38,56 40,55 Q42,56 44,52' stroke='#4a5a6a' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 14,
    name: 'ม้า',
    emoji: '🐴',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <ellipse cx='24' cy='16' rx='10' ry='18' fill='#5C3010' transform='rotate(-20 24 16)'/>
  <ellipse cx='42' cy='46' rx='28' ry='32' fill='#A0522D'/>
  <ellipse cx='40' cy='62' rx='14' ry='10' fill='#C4845A'/>
  <circle cx='26' cy='38' r='6' fill='white'/>
  <circle cx='56' cy='36' r='5' fill='white'/>
  <circle cx='27' cy='39' r='4' fill='#2a1a00'/>
  <circle cx='57' cy='37' r='3.5' fill='#2a1a00'/>
  <circle cx='28.5' cy='37.5' r='1.5' fill='white'/>
  <circle cx='58.5' cy='35.5' r='1.2' fill='white'/>
  <ellipse cx='35' cy='64' rx='3' ry='2' fill='#8B4020'/>
  <ellipse cx='45' cy='64' rx='3' ry='2' fill='#8B4020'/>
  <ellipse cx='24' cy='22' rx='5' ry='10' fill='#A0522D' transform='rotate(-15 24 22)'/>
  <ellipse cx='24' cy='22' rx='3' ry='7' fill='#FFB8A0' transform='rotate(-15 24 22)'/>
</svg>`,
  },
  {
    id: 15,
    name: 'ลิง',
    emoji: '🐵',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='10' cy='42' r='14' fill='#A0702A'/>
  <circle cx='70' cy='42' r='14' fill='#A0702A'/>
  <circle cx='10' cy='42' r='9' fill='#C4945A'/>
  <circle cx='70' cy='42' r='9' fill='#C4945A'/>
  <circle cx='40' cy='40' r='30' fill='#C4945A'/>
  <ellipse cx='40' cy='48' rx='20' ry='18' fill='#E8C488'/>
  <circle cx='28' cy='36' r='5' fill='white'/>
  <circle cx='52' cy='36' r='5' fill='white'/>
  <circle cx='29' cy='37' r='3.5' fill='#2a1200'/>
  <circle cx='53' cy='37' r='3.5' fill='#2a1200'/>
  <circle cx='30.5' cy='35.5' r='1.2' fill='white'/>
  <circle cx='54.5' cy='35.5' r='1.2' fill='white'/>
  <ellipse cx='40' cy='48' rx='4' ry='2.5' fill='#8B5020'/>
  <ellipse cx='37' cy='49' rx='1.5' ry='1' fill='#6B3010'/>
  <ellipse cx='43' cy='49' rx='1.5' ry='1' fill='#6B3010'/>
  <path d='M30,54 Q35,59 40,59 Q45,59 50,54' stroke='#6B3010' stroke-width='2' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 16,
    name: 'นกแก้ว',
    emoji: '🦜',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='42' r='34' fill='#FF5733'/>
  <ellipse cx='40' cy='20' rx='22' ry='18' fill='#4CAF50'/>
  <ellipse cx='20' cy='46' rx='12' ry='10' fill='#1565C0'/>
  <ellipse cx='60' cy='46' rx='12' ry='10' fill='#1565C0'/>
  <circle cx='28' cy='36' r='6' fill='#F5E842'/>
  <circle cx='52' cy='36' r='6' fill='#F5E842'/>
  <circle cx='28' cy='37' r='4' fill='#0a0a0a'/>
  <circle cx='52' cy='37' r='4' fill='#0a0a0a'/>
  <circle cx='29.5' cy='35.5' r='1.5' fill='white'/>
  <circle cx='53.5' cy='35.5' r='1.5' fill='white'/>
  <path d='M34,47 Q40,42 46,47 Q40,56 34,47Z' fill='#FF8C10'/>
  <path d='M36,49 Q40,54 44,49' fill='#E07010' opacity='0.7'/>
</svg>`,
  },
  {
    id: 17,
    name: 'แฮมสเตอร์',
    emoji: '🐹',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='12' cy='52' r='16' fill='#FFD28F'/>
  <circle cx='68' cy='52' r='16' fill='#FFD28F'/>
  <circle cx='40' cy='40' r='30' fill='#FFD28F'/>
  <circle cx='22' cy='16' r='10' fill='#FFD28F'/>
  <circle cx='22' cy='16' r='6' fill='#FFB870'/>
  <circle cx='58' cy='16' r='10' fill='#FFD28F'/>
  <circle cx='58' cy='16' r='6' fill='#FFB870'/>
  <circle cx='28' cy='36' r='6.5' fill='#1a0a00'/>
  <circle cx='52' cy='36' r='6.5' fill='#1a0a00'/>
  <circle cx='30' cy='34' r='2.5' fill='white'/>
  <circle cx='54' cy='34' r='2.5' fill='white'/>
  <ellipse cx='40' cy='46' rx='3' ry='2' fill='#FF69B4'/>
  <path d='M37,49 Q40,52 43,49' stroke='#C4844A' stroke-width='1.5' fill='none' stroke-linecap='round'/>
  <line x1='20' y1='46' x2='33' y2='47' stroke='#C4844A' stroke-width='1' opacity='0.5'/>
  <line x1='47' y1='47' x2='60' y2='46' stroke='#C4844A' stroke-width='1' opacity='0.5'/>
</svg>`,
  },
  {
    id: 18,
    name: 'เป็ด',
    emoji: '🦆',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='40' cy='42' r='34' fill='#F5E642'/>
  <ellipse cx='40' cy='10' rx='8' ry='12' fill='#E8D420' transform='rotate(-10 40 10)'/>
  <circle cx='27' cy='36' r='7' fill='white'/>
  <circle cx='54' cy='38' r='7' fill='white'/>
  <circle cx='28' cy='37' r='5' fill='#1a0a00'/>
  <circle cx='55' cy='39' r='5' fill='#1a0a00'/>
  <circle cx='30' cy='35' r='2' fill='white'/>
  <circle cx='57' cy='37' r='2' fill='white'/>
  <ellipse cx='40' cy='52' rx='10' ry='6' fill='#FF8C10'/>
  <path d='M30,52 Q40,58 50,52' fill='#E87010' opacity='0.7'/>
  <circle cx='20' cy='49' r='7' fill='#FFB870' opacity='0.45'/>
  <circle cx='60' cy='49' r='7' fill='#FFB870' opacity='0.45'/>
</svg>`,
  },
  {
    id: 19,
    name: 'โคอาล่า',
    emoji: '🐨',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <circle cx='14' cy='24' r='18' fill='#9E9E9E'/>
  <circle cx='66' cy='24' r='18' fill='#9E9E9E'/>
  <circle cx='14' cy='24' r='12' fill='#F5F5F5'/>
  <circle cx='66' cy='24' r='12' fill='#F5F5F5'/>
  <circle cx='14' cy='24' r='7' fill='#BDBDBD'/>
  <circle cx='66' cy='24' r='7' fill='#BDBDBD'/>
  <circle cx='40' cy='46' r='30' fill='#9E9E9E'/>
  <circle cx='28' cy='40' r='5' fill='#2a1a00'/>
  <circle cx='52' cy='40' r='5' fill='#2a1a00'/>
  <circle cx='30' cy='38.5' r='1.5' fill='white'/>
  <circle cx='54' cy='38.5' r='1.5' fill='white'/>
  <ellipse cx='40' cy='53' rx='9' ry='7' fill='#424242'/>
  <circle cx='37' cy='53' r='1.5' fill='#616161'/>
  <circle cx='43' cy='53' r='1.5' fill='#616161'/>
  <path d='M36,58 Q40,62 44,58' stroke='#424242' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`,
  },
  {
    id: 20,
    name: 'กวาง',
    emoji: '🦌',
    svg: `<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
  <path d='M28,24 Q20,14 14,10 Q12,16 18,18 Q13,20 10,16 Q12,24 20,22 Q24,24 26,30' stroke='#8B5E3C' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>
  <path d='M52,24 Q60,14 66,10 Q68,16 62,18 Q67,20 70,16 Q68,24 60,22 Q56,24 54,30' stroke='#8B5E3C' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>
  <circle cx='40' cy='48' r='30' fill='#C68642'/>
  <ellipse cx='13' cy='42' rx='8' ry='12' fill='#C68642'/>
  <ellipse cx='13' cy='42' rx='5' ry='8' fill='#FFB8A0'/>
  <ellipse cx='67' cy='42' rx='8' ry='12' fill='#C68642'/>
  <ellipse cx='67' cy='42' rx='5' ry='8' fill='#FFB8A0'/>
  <circle cx='27' cy='38' r='6.5' fill='#1a0a00'/>
  <circle cx='53' cy='38' r='6.5' fill='#1a0a00'/>
  <circle cx='29' cy='36' r='2.5' fill='white'/>
  <circle cx='55' cy='36' r='2.5' fill='white'/>
  <circle cx='24' cy='37' r='3' fill='#F5E8DC' opacity='0.6'/>
  <circle cx='56' cy='37' r='3' fill='#F5E8DC' opacity='0.6'/>
  <ellipse cx='40' cy='53' rx='5' ry='3.5' fill='#2a1200'/>
  <path d='M36,56 Q38,59 40,58 Q42,59 44,56' stroke='#8B5E3C' stroke-width='1.5' fill='none' stroke-linecap='round'/>
</svg>`,
  },
]

export function getAvatarById (id: number): Avatar | undefined {
  return AVATARS.find((a) => a.id === id)
}

export function getRandomAvatar (): Avatar {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}
