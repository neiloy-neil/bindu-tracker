import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BranchStore = {
  selectedBranch: string | null
  setSelectedBranch: (branch: string | null) => void
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      selectedBranch: null,
      setSelectedBranch: (branch) => set({ selectedBranch: branch }),
    }),
    { name: 'bindu-branch-storage' }
  )
)
