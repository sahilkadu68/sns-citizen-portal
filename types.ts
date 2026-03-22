
export enum UserRole {
  CITIZEN = 'ROLE_CITIZEN',
  ADMIN = 'ROLE_ADMIN',
  SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
  DEPT_HEAD = 'ROLE_DEPT_HEAD',
  OFFICER = 'ROLE_OFFICER'
}

export enum ComplaintStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED'
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: UserRole;
  address?: string;
  department?: { id: number; name: string };
  employeeId?: string;
  token?: string;
}

export interface Complaint {
  complaintId: number;
  complaintNumber: string; // The SNS-YYYYMMDD-XXXX format
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  resolutionProof?: string;
  resolutionNotes?: string;
  submittedAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  escalatedAt?: string;
  slaDeadline?: string;
  escalationLevel?: number;
  category?: { name: string };
  department?: { name: string };
  user?: User;
  assignedTo?: User;
  imageUrl?: string;
  address?: string;
  citizenRating?: number;
  citizenFeedback?: string;
  duplicateCount?: number;
  parentComplaintId?: number;
}
