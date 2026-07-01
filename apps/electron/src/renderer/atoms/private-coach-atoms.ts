import { atom } from 'jotai'
import type {
  PrivateCoachDepth,
  PrivateCoachPlatform,
  PrivateCoachResult,
  PrivateCoachScene,
  PrivateCoachTone,
} from '@proma/shared'

export interface PrivateCoachFormState {
  platform: PrivateCoachPlatform
  scene: PrivateCoachScene
  tone: PrivateCoachTone
  analysisDepth: PrivateCoachDepth
  userGoal: string
  conversationText: string
}

export const privateCoachDefaultFormState: PrivateCoachFormState = {
  platform: 'generic',
  scene: '未指定',
  tone: '稳妥',
  analysisDepth: 'standard',
  userGoal: '',
  conversationText: '',
}

export const privateCoachFormAtom = atom<PrivateCoachFormState>(privateCoachDefaultFormState)
export const privateCoachResultAtom = atom<PrivateCoachResult | null>(null)
export const privateCoachLoadingAtom = atom(false)
export const privateCoachErrorAtom = atom<string | null>(null)
