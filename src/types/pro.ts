import { Timestamp } from "firebase/firestore";

export interface Pro {
  id: string;

  companyName: string;
  displayName: string;
  ownerUid: string;

  city: string;
  cities: string[];
  professions: string[];
  categoryId?: string;

  isVisible: boolean;
  isSponsored: boolean;

  ratingAvg: number;
  ratingCount: number;
  ratingTotal: number;

  isDeleted?: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
  adminNote?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}