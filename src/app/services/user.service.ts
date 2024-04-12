import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import { DB } from "../database"

import type { NamespaceAttributes } from "@/app/database/interfaces/namespace.interface"
import type { UserAttributes, UserCreationAttributes, UserInstance } from "@/app/database/interfaces/user.interface"
import type {
  BaseUserResponse,
  UserAuthFirstLoginResponse,
  UserListItem,
  UserResponseWithNameSpace,
  UserResponseWithToken
} from "@/interfaces/auth.interface"
import type { UserDetails } from "@/interfaces/user.interface"
import type { OrderItem } from "sequelize"

export class UserService {
  private saltRounds = 10
  private secretKey = "dfhisdabcsdiubciweubfd37rg3279g39gG&@(E!&(E"

  public async getOrCreateUser(data: UserCreationAttributes): Promise<UserAttributes | Error> {
    try {
      const hashedPassword = data.password ? await this.getHashedPassword(data.password) : ""

      const [item, created] = await DB.models.User.findOrCreate({
        where: {
          email: data.email
        },
        defaults: { ...data, password: hashedPassword }
      })

      if (!created && !item) return new Error("User creation failed")

      return item
    } catch (error) {
      return error as Error
    }
  }

  public async getUsersList(namespaceId: number, order?: Array<OrderItem>): Promise<Array<UserListItem> | Error> {
    try {
      const users = await DB.models.User.findAll({
        where: { namespace_id: namespaceId },
        include: {
          model: DB.models.Namespace,
          as: "namespace",
          attributes: ["id", "name"]
        },
        ...(order && { order })
      })

      return users.map(user => this.formatUserDetails(user))
    } catch (e) {
      return e as Error
    }
  }

  public async setPassword(email: string, password: string): Promise<UserResponseWithToken | Error> {
    try {
      const user = await DB.models.User.findOne({
        where: { email },
        include: {
          model: DB.models.Namespace,
          as: "namespace",
          attributes: ["id", "name"]
        },
        attributes: ["id", "email", "is_admin", "is_active", "password", "namespace_id", "name"]
      })
      if (user instanceof Error) return user

      if (!user) return new Error("Wrong email")
      if (!user.namespace) return new Error("Namespace not found")
      if (user.password) return new Error("Password is exist")

      const newPassword = await this.getHashedPassword(password)
      const response = await user.update({ ...user, password: newPassword })

      if (response) {
        const token = this.generateToken({
          id: user.id,
          email: user.email,
          is_admin: user.is_admin,
          name: user.name
        })

        return this.formatUserResponseWithToken(user, token)
      }

      return new Error("Error while setting password")
    } catch {
      return new Error("Wrong login or password")
    }
  }

  public async updateUser(payload: UserAttributes, userId: number): Promise<UserDetails | Error> {
    try {
      const user = await this.getUserAttributesById(userId)
      if (user instanceof Error) return user

      const updatePayload = {
        name: payload?.name ? payload.name : user.name,
        is_admin: "is_admin" in payload ? payload.is_admin : user.is_admin,
        is_active: "is_active" in payload ? payload.is_active : user.is_active
      }

      const updatedUser = await user.update({ ...updatePayload })

      return this.formatUserDetails(updatedUser)
    } catch (e) {
      return e as Error
    }
  }

  public async getUserById(userId: number): Promise<UserDetails | Error> {
    try {
      const user = await this.getUserAttributesById(userId)
      if (user instanceof Error) return user

      return this.formatUserDetails(user)
    } catch (e) {
      return e as Error
    }
  }

  public async resetPassword(userId: number): Promise<boolean | Error> {
    try {
      const user = await DB.models.User.findByPk(userId)
      if (!user) return new Error("User not found")

      const updatedUser = await user.update({ password: "" })

      return !!updatedUser
    } catch (e) {
      return e as Error
    }
  }

  public async auth(email: string, password: string): Promise<UserResponseWithToken | Error> {
    try {
      const user = await DB.models.User.findOne({
        where: { email },
        include: {
          model: DB.models.Namespace,
          as: "namespace",
          attributes: ["id", "name"]
        },
        attributes: ["id", "email", "is_admin", "is_active", "password", "name"]
      })

      if (user instanceof Error) return user

      if (!user || !user.is_active) throw new Error("Wrong login or password")
      if (!user.namespace) throw new Error("Namespace not found")

      const isPasswordMatch = await bcrypt.compare(password, user.password)

      if (!isPasswordMatch) throw new Error("Wrong login or password")

      const token = this.generateToken({
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        name: user.name
      })

      return this.formatUserResponseWithToken(user, token)
    } catch {
      throw new Error("Wrong login or password")
    }
  }

  public async checkIsFirstLogin(email: string): Promise<UserAuthFirstLoginResponse | Error> {
    try {
      const user = await DB.models.User.findOne({ where: { email } })
      if (user instanceof Error) return user

      if (!user || !user.is_active) throw new Error("Wrong login or password")

      return {
        is_first_login: !user.password
      }
    } catch {
      throw new Error("Wrong login or password")
    }
  }

  public async checkToken(request: Request): Promise<UserResponseWithNameSpace | Error> {
    try {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "")

      if (!token) return new Error("Invalid token")
      const payload = (await jwt.verify(token, this.secretKey)) as BaseUserResponse

      const user = await DB.models.User.findByPk(payload.id, {
        include: {
          model: DB.models.Namespace,
          as: "namespace",
          attributes: ["id", "name"]
        }
      })
      if (!user || !user.namespace) return new Error("User not found")

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        namespace: {
          id: user.namespace.id,
          name: user.namespace.name
        },
        is_admin: user.is_admin
      }
    } catch {
      throw new Error("Wrong token")
    }
  }

  private async getHashedPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds)
  }

  private generateToken = (payload: BaseUserResponse) => {
    return jwt.sign(payload, this.secretKey, { expiresIn: "90d" })
  }

  private async getUserAttributesById(userId: number): Promise<UserInstance | Error> {
    try {
      const user = await DB.models.User.findByPk(userId, {
        include: {
          model: DB.models.Namespace,
          as: "namespace",
          attributes: ["id", "name"]
        }
      })
      if (!user) return new Error("User not found")

      return user
    } catch (error) {
      return error as Error
    }
  }

  private formatUserDetails(user: UserAttributes): UserDetails {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin,
      is_active: user.is_active,
      created_at: user.created_at,
      namespace: user.namespace
        ? {
            id: user.namespace.id,
            name: user.namespace.name
          }
        : null
    }
  }

  private formatUserResponseWithToken(user: UserAttributes, token: string): UserResponseWithToken {
    return {
      id: user.id,
      email: user.email,
      namespace: user.namespace as NamespaceAttributes,
      name: user.name,
      is_admin: user.is_admin,
      token
    }
  }
}
