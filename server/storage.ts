import { meetings, type Meeting, type InsertMeeting } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getMeeting(id: number): Promise<Meeting | undefined>;
  getMeetingByRoomName(roomName: string): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
}

export class MemStorage implements IStorage {
  private meetings: Map<number, Meeting>;
  currentId: number;

  constructor() {
    this.meetings = new Map();
    this.currentId = 1;
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getMeetingByRoomName(roomName: string): Promise<Meeting | undefined> {
    return Array.from(this.meetings.values()).find(
      (meeting) => meeting.roomName === roomName,
    );
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = this.currentId++;
    const meeting: Meeting = { 
      ...insertMeeting, 
      id, 
      createdAt: new Date() 
    };
    this.meetings.set(id, meeting);
    return meeting;
  }
}

export const storage = new MemStorage();