export const parseBranchList = (value: string): Array<string> => [
  ...new Set(
    value
      .split(",")
      .map(branch => branch.trim())
      .filter(Boolean)
  )
]

export const formatBranchList = (branches: Array<string>): string => parseBranchList(branches.join(",")).join(",")
