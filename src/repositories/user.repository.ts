import { UserModel, IUser } from "../models/user.model";

export interface IUserRepository {
  getUserByEmail(email: string): Promise<IUser | null>;
  getUserByUsername(username: string): Promise<IUser | null>;
  // 5 common mandatory methods for a repository
  createUser(user: Partial<IUser>): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  getAll(): Promise<IUser[]>;
  update(id: string, user: Partial<IUser>): Promise<IUser | null>;
  delete(id: string): Promise<boolean>;
  getAllPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: IUser[]; total: number }>;
}
export class UserMongoRepository implements IUserRepository {
  async getUserById(id: string): Promise<IUser | null> {
    // const found = await UserModel.findOne({ _id: id });
    const found = await UserModel.findById(id).select("-password");
    return found;
  }

  // async getUserById(id: string) {
  //   return await UserModel.findById(id);
  // }

  // async getUserByIdWithoutPassword(id: string) {
  //   return await UserModel.findById(id).select("-password");
  // }
  async getUserByEmail(email: string): Promise<IUser | null> {
    const found = await UserModel.findOne({ email });
    return found;
  }
  async getUserByUsername(username: string): Promise<IUser | null> {
    const found = await UserModel.findOne({ username });
    return found;
  }
  async createUser(user: Partial<IUser>): Promise<IUser> {
    const created = await UserModel.create(user);
    return created;
  }
  async getAll(): Promise<IUser[]> {
    const found = await UserModel.find();
    return found;
  }
  async update(id: string, user: Partial<IUser>): Promise<IUser | null> {
    const updated = await UserModel.findByIdAndUpdate(id, user, { new: true });
    return updated;
  }
  async delete(id: string): Promise<boolean> {
    const deleted = await UserModel.findByIdAndDelete(id);
    return !!deleted;
  }
  // async getAllPaginated(
  //   page: number,
  //   limit: number,
  //   search?: string,
  // ): Promise<{ data: IUser[]; total: number }> {
  //   const query: any = {};
  //   if (search) {
  //     query.$or = [
  //       { username: { $regex: search, $options: "i" } },
  //       { email: { $regex: search, $options: "i" } },
  //     ];
  //   }
  //   const total = await UserModel.countDocuments(query);
  //   // const data = await UserModel.find(query)
  //   //   .skip((page - 1) * limit)
  //   //   .limit(limit);
  //   const data = await UserModel.find(query)
  //     .select("-password") // Hide password
  //     .sort({ createdAt: -1 }) // Show newest users first
  //     .skip((page - 1) * limit)
  //     .limit(limit);
  //   return { data, total };
  // }

  async getAllPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: IUser[]; total: number }> {
    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await UserModel.countDocuments(query);

    const data = await UserModel.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { data, total };
  }
}
