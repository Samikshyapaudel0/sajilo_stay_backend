// import { UserMongoRepository } from "../repositories/user.repository";
// import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
// import { IUser } from "../models/user.model";

// import { HttpException } from "../exceptions/http-exception";
// import bycryptjs from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { SECRET_KEY } from "../configs/constant";

// const userRepository = new UserMongoRepository();

// export class UserService {
//   async createUser(userData: CreateUserDTO): Promise<IUser> {
//     // validation
//     const existingEmail = await userRepository.getUserByEmail(userData.email);
//     if (existingEmail) {
//       throw new HttpException(400, "Email already exists");
//     }
//     const existingUsername = await userRepository.getUserByUsername(
//       userData.username,
//     );
//     if (existingUsername) {
//       throw new HttpException(400, "Username already exists");
//     }
//     // hash password
//     const hashedPassword = await bycryptjs.hash(userData.password, 10);
//     userData.password = hashedPassword;
//     const user = await userRepository.createUser(userData);
//     return user;
//   }

//   async loginUser(loginData: LoginUserDTO) {
//     const user = await userRepository.getUserByEmail(loginData.email);
//     if (!user) {
//       throw new HttpException(400, "Invalid email");
//     }
//     const isPasswordValid = await bycryptjs.compare(
//       loginData.password, // client password
//       user.password, // database password
//     );
//     if (!isPasswordValid) {
//       throw new HttpException(400, "Invalid password");
//     }
//     const token = jwt.sign(
//       { id: user._id, email: user.email, role: user.role }, // payload
//       SECRET_KEY,
//       { expiresIn: "30d" },
//     );
//     return { user, token };
//   }
//   async updateUser(id: string, userData: UpdateUserDTO): Promise<IUser> {
//     const existingUser = await userRepository.getUserById(id);
//     if (!existingUser) {
//       throw new HttpException(404, "User not found");
//     }
//     if (userData.email && userData.email !== existingUser.email) {
//       const existingEmail = await userRepository.getUserByEmail(userData.email);
//       if (existingEmail) {
//         throw new HttpException(400, "Email already exists");
//       }
//     }
//     if (userData.username && userData.username !== existingUser.username) {
//       const existingUsername = await userRepository.getUserByUsername(
//         userData.username,
//       );
//       if (existingUsername) {
//         throw new HttpException(400, "Username already exists");
//       }
//     }
//     if (userData.password) {
//       const hashedPassword = await bycryptjs.hash(userData.password, 10);
//       userData.password = hashedPassword;
//     }
//     const updatedUser = await userRepository.update(id, userData);
//     if (!updatedUser) {
//       throw new HttpException(500, "Failed to update user");
//     }
//     return updatedUser;
//   }
// }

import { UserMongoRepository } from "../repositories/user.repository";
import {
  CreateUserDTO,
  CreateUserDTOAdmin,
  LoginUserDTO,
  UpdateUserDTO,
} from "../dtos/user.dto";
import { IUser } from "../models/user.model";
import { HttpException } from "../exceptions/http-exception";
import bycryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { CLIENT_URL, SECRET_KEY } from "../configs/constant";
import { sendEmail } from "../configs/email";

const userRepository = new UserMongoRepository();

export class UserService {
  async createUser(
    userData: CreateUserDTO | CreateUserDTOAdmin,
  ): Promise<IUser> {
    // validation
    const existingEmail = await userRepository.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new HttpException(400, "Email already exists");
    }
    const existingUsername = await userRepository.getUserByUsername(
      userData.username,
    );
    if (existingUsername) {
      throw new HttpException(400, "Username already exists");
    }
    // hash password
    const hashedPassword = await bycryptjs.hash(userData.password, 10);
    userData.password = hashedPassword;
    const user = await userRepository.createUser(userData);
    return user;
  }

  // async loginUser(loginData: LoginUserDTO) {
  //   const user = await userRepository.getUserByEmail(loginData.email);
  //   if (!user) {
  //     throw new HttpException(400, "Invalid email");
  //   }
  //   const isPasswordValid = await bycryptjs.compare(
  //     loginData.password, // client password
  //     user.password, // database password
  //   );
  //   if (!isPasswordValid) {
  //     throw new HttpException(400, "Invalid password");
  //   }
  //   console.log("LOGIN SECRET:", SECRET_KEY);

  //   const token = jwt.sign(
  //     { id: user._id, email: user.email, role: user.role }, // payload
  //     SECRET_KEY,
  //     { expiresIn: "30d" },
  //   );
  //   console.log("NEW TOKEN:", token);

  //   return { user, token };
  // }
  async loginUser(loginData: LoginUserDTO) {
    try {
      console.log("Looking for user...");

      const user = await userRepository.getUserByEmail(loginData.email);
      console.log("User:", user);

      if (!user) {
        throw new HttpException(400, "Invalid email");
      }

      console.log("Comparing password...");

      const isPasswordValid = await bycryptjs.compare(
        loginData.password,
        user.password,
      );

      console.log("Password valid:", isPasswordValid);

      if (!isPasswordValid) {
        throw new HttpException(400, "Invalid password");
      }

      console.log("SECRET:", SECRET_KEY);

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        SECRET_KEY,
        {
          expiresIn: "30d",
        },
      );

      console.log("TOKEN CREATED");

      return { user, token };
    } catch (e) {
      console.error("LOGIN ERROR:");
      console.error(e);
      throw e;
    }
  }

  async checkPassword(
    userId: string,
    currentPassword: string,
  ): Promise<boolean> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpException(404, "User not found");
    }
    const isPasswordValid = await bycryptjs.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new HttpException(400, "Current password is incorrect");
    }
    return isPasswordValid;
  }

  async updateUser(id: string, userData: UpdateUserDTO): Promise<IUser> {
    const existingUser = await userRepository.getUserById(id);
    if (!existingUser) {
      throw new HttpException(404, "User not found");
    }
    if (userData.email && userData.email !== existingUser.email) {
      const existingEmail = await userRepository.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new HttpException(400, "Email already exists");
      }
    }
    if (userData.username && userData.username !== existingUser.username) {
      const existingUsername = await userRepository.getUserByUsername(
        userData.username,
      );
      if (existingUsername) {
        throw new HttpException(400, "Username already exists");
      }
    }
    if (userData.password) {
      const hashedPassword = await bycryptjs.hash(userData.password, 10);
      userData.password = hashedPassword;
    }
    const updatedUser = await userRepository.update(id, userData);
    if (!updatedUser) {
      throw new HttpException(500, "Failed to update user");
    }
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const existingUser = await userRepository.getUserById(id);
    if (!existingUser) {
      throw new HttpException(404, "User not found");
    }
    const deleted = await userRepository.delete(id);
    if (!deleted) {
      throw new HttpException(500, "Failed to delete user");
    }
    return deleted;
  }

  async getUserById(id: string): Promise<IUser | null> {
    const user = await userRepository.getUserById(id);
    if (!user) {
      throw new HttpException(404, "User not found");
    }
    return user;
  }

  async getAllUserPaginated(page?: string, limit?: string, search?: string) {
    const currentPage = page && parseInt(page) > 0 ? parseInt(page) : 1;
    const currentLimit = limit && parseInt(limit) > 0 ? parseInt(limit) : 10;
    const currentSearch = search && search.trim() !== "" ? search : undefined;

    const { data, total } = await userRepository.getAllPaginated(
      currentPage,
      currentLimit,
      currentSearch,
    );
    const totalPages = Math.ceil(total / currentLimit);
    const pagination = {
      page: currentPage,
      limit: currentLimit,
      totalPages: totalPages,
      total: total,
    };
    return { data, pagination };
  }
  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpException(400, "Email is required");
    }
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new HttpException(404, "User not found");
    }
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" }); // 1 hour expiry
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
    const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    await sendEmail(user.email, "Password Reset", html);
    return { user, token };
  }
  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpException(400, "Token and new password are required");
      }
      const decoded: any = jwt.verify(token, SECRET_KEY);
      const userId = decoded.id;
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new HttpException(404, "User not found");
      }
      const hashedPassword = await bycryptjs.hash(newPassword, 10);
      await userRepository.update(userId, { password: hashedPassword });
      return user;
    } catch (error) {
      throw new HttpException(400, "Invalid or expired token");
    }
  }
}