import fs from "fs";
import path from "path";

// Ensure the data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate a random 24-character hex ID (similar to MongoDB ObjectId)
function generateId(): string {
  return Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

// Helper for atomic file reads and writes
function readJsonFile<T>(filename: string, defaultValue: T): T {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify(defaultValue, null, 2), "utf8");
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filepath, "utf8");
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filename}, resetting to default:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  const filepath = path.join(DATA_DIR, filename);
  const tempPath = `${filepath}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempPath, filepath);
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
  }
}

// Custom Model implementation to mirror Mongoose API
class Model<T extends { _id?: string; [key: string]: any }> {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  private getAll(): T[] {
    return readJsonFile<T[]>(this.filename, []);
  }

  private saveAll(data: T[]): void {
    writeJsonFile<T[]>(this.filename, data);
  }

  async find(filter: Partial<T> | ((item: T) => boolean) = {}): Promise<T[]> {
    const items = this.getAll();
    if (typeof filter === "function") {
      return items.filter(filter);
    }
    return items.filter((item) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const items = this.getAll();
    const found = items.find((item) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    return found ? { ...found } : null;
  }

  async findById(id: string): Promise<T | null> {
    const items = this.getAll();
    const found = items.find((item) => item._id === id);
    return found ? { ...found } : null;
  }

  async findByIdAndUpdate(id: string, update: Partial<T>): Promise<T | null> {
    const items = this.getAll();
    const index = items.findIndex((item) => item._id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...update };
    this.saveAll(items);
    return items[index];
  }

  async findOneAndUpdate(filter: Partial<T>, update: Partial<T>): Promise<T | null> {
    const items = this.getAll();
    const index = items.findIndex((item) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });

    if (index === -1) {
      // If we don't find it, we can return null or insert it depending on mongoose settings, but here we'll return null
      return null;
    }

    items[index] = { ...items[index], ...update };
    this.saveAll(items);
    return items[index];
  }

  async create(data: Omit<T, "_id"> & { _id?: string }): Promise<T> {
    const items = this.getAll();
    const newItem = {
      _id: data._id || generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as T;

    items.push(newItem);
    this.saveAll(items);
    return newItem;
  }

  // To support new Instance model structure e.g. const u = new User(data); await u.save();
  instantiate(data: any): T & { save: () => Promise<T> } {
    const self = this;
    const instanceData = {
      _id: data._id || generateId(),
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      ...instanceData,
      async save(): Promise<T> {
        const items = self.getAll();
        const index = items.findIndex((item) => item._id === instanceData._id);
        if (index > -1) {
          items[index] = { ...items[index], ...instanceData, updatedAt: new Date().toISOString() };
        } else {
          items.push(instanceData);
        }
        self.saveAll(items);
        return instanceData;
      },
    } as any;
  }
}

// Interfaces to ensure strict type matching
export interface NotificationType {
  type: string;
  message: string;
  onClickPath: string;
  date?: string;
}

export interface UserType {
  _id: string;
  name?: string;
  fullName?: string; // Sometimes used as name
  email: string;
  password?: string;
  phone?: string;
  type: "user" | "admin";
  isdoctor?: boolean;
  notification: NotificationType[];
  seennotification: NotificationType[];
}

export interface DoctorType {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  experience: string;
  fees: number;
  status: "pending" | "approved" | "rejected";
  timings: {
    start: string;
    end: string;
  } | string | any;
}

export interface AppointmentType {
  _id: string;
  userId: string;
  doctorId: string;
  userInfo: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  doctorInfo: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    specialization?: string;
    [key: string]: any;
  };
  date: string;
  document: {
    filename: string;
    path: string;
    mimetype: string;
  } | null;
  status: "pending" | "approved" | "rejected" | "completed";
  notes?: string;
  createdAt?: string;
}

// Export Models
export const UserDB = new Model<UserType>("users.json");
export const DoctorDB = new Model<DoctorType>("doctors.json");
export const AppointmentDB = new Model<AppointmentType>("appointments.json");

// Setup initial administrator if none exists
async function seedAdmin() {
  const admin = await UserDB.findOne({ type: "admin" });
  if (!admin) {
    // Creating default admin: admin@medicare.com / admin123
    // We can also have an endpoint, but seeding guarantees we have an admin ready
    // Using simple bcrypt hash of admin123 for default convenience, or let registration handle it
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await UserDB.create({
      fullName: "System Admin",
      email: "admin@medicare.com",
      password: hashedPassword,
      phone: "1234567890",
      type: "admin",
      isdoctor: false,
      notification: [],
      seennotification: [],
    } as any);
    console.log("Seeded default admin user: admin@medicare.com / admin123");
  }
}

// Run seed asynchronously in background
seedAdmin().catch(console.error);
