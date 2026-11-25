import { DB } from "../database"

import type { LastBranchAttributes } from "@/app/database/interfaces/last-branch.interface"

export class LastBranchService {
  public async remember(stand_id: number, repository_id: number, branch_name: string): Promise<void> {
    await DB.models.LastBranch.upsert(
      { stand_id, repository_id, branch_name, updated_at: new Date() },
      { conflictFields: ["stand_id", "repository_id"] }
    )
  }

  public async findByStandIds(standIds: Array<number>): Promise<Array<LastBranchAttributes>> {
    return await DB.models.LastBranch.findAll({ where: { stand_id: standIds }, raw: true })
  }
}
