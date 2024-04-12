import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Op } from "sequelize"

import { DB } from "@/app/database"

import type { NamespaceInstance } from "@/app/database/interfaces/namespace.interface"
import type { UserCreationAttributes, UserAttributes } from "@/app/database/interfaces/user.interface"
import type { BaseUserResponse } from "@/interfaces/auth.interface"

class User {
  public id!: number
  public token!: string
  public data?: UserAttributes

  private saltRounds = 10
  private secretKey = "dfhisdabcsdiubciweubfd37rg3279g39gG&@(E!&(E"

  public async create(payload?: Partial<UserCreationAttributes> | null): Promise<this> {
    const transaction = await DB.sequelize.transaction()

    try {
      const namespace = await this.getOrCreateNamespace(payload?.namespace_id)
      const password = await this.getHashedPassword(payload?.password)

      const userData: UserCreationAttributes = {
        email: payload?.email || "1@test.wavix",
        name: payload?.name || "1@test",
        namespace_id: payload?.namespace_id || namespace.id,
        is_active: payload?.is_active || true,
        is_admin: payload?.is_admin || true,
        password
      }
      const userRaw = await DB.models.User.create(userData, { transaction })
      const user = userRaw.toJSON()

      const token = this.generateToken({
        email: user.email,
        id: user.id,
        is_admin: user.is_admin,
        name: user.name
      })

      this.id = user.id
      this.data = { ...user, namespace }
      this.token = token

      await transaction.commit()

      return this
    } catch (error) {
      console.error(error)
      await transaction.rollback()
      return this
    }
  }

  public async destroy(): Promise<void> {
    if (!this.id) return

    const transaction = await DB.sequelize.transaction()

    try {
      if (this.data) {
        await DB.models.Namespace.destroy({ where: { id: this.data.namespace_id }, transaction })
      }

      await DB.models.User.destroy({ where: { id: this.id }, transaction })

      await transaction.commit()
    } catch {
      await transaction.rollback()
    }
  }

  private async getOrCreateNamespace(namespaceId?: number): Promise<NamespaceInstance> {
    const [namespace] = await DB.models.Namespace.findOrCreate({
      where: {
        [Op.or]: [
          {
            ...(namespaceId && { id: namespaceId })
          },
          {
            name: "Test namespace"
          }
        ]
      },
      defaults: { name: "Test namespace" }
    })

    return namespace
  }

  private generateToken = (payload: BaseUserResponse) => {
    return jwt.sign(payload, this.secretKey, { expiresIn: "90d" })
  }

  private async getHashedPassword(password?: string): Promise<string> {
    if (!password) return ""
    return await bcrypt.hash(password, this.saltRounds)
  }
}

export default User
