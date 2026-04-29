/**
 * Firestore CRUD helpers for Tractar.
 *
 * Data model:
 *   users/{uid}                          – user profile
 *   users/{uid}/listings/{listingId}     – property listings
 *   users/{uid}/financials/{listingId}   – financial calculator state
 *   users/{uid}/expenses/{listingId}     – expense records
 *   users/{uid}/calendar/{listingId}     – calendar / booking events
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Listing = {
  id: string;
  name: string;
  address: string;
  type: string;
  color: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type FinancialData = {
  [key: string]: unknown;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  recurring: boolean;
  period?: "monthly" | "one-time";
  receipt?: string;
};

export type FSBooking = {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  source: string;
  status: string;
  paymentStatus: string;
  chargeAmount: number;
  discountAmount: number;
  amountPaid: number;
  notes: string;
  createdAt: string;
};

export type FSReferral = {
  id: string;
  date: string;
  guestName: string;
  referredTo: string;
  commissionAmount: number;
  commissionReceived: number;
  paymentStatus: "received" | "pending" | "partial";
  notes: string;
  createdAt: string;
};

export type FSCalendarSource = {
  id: string;
  platform: string;
  url: string;
  color: string;
  lastSynced: string | null;
  status: "synced" | "error" | "pending";
  lastSyncCount?: number;
  lastSyncError?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "booking" | "blocked" | "maintenance";
  notes?: string;
  createdAt?: Timestamp;
};

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: Omit<UserProfile, "createdAt" | "updatedAt">) {
  await setDoc(doc(db, "users", profile.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid: string, updates: Partial<Omit<UserProfile, "uid" | "createdAt">>) {
  await updateDoc(doc(db, "users", uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function getListings(uid: string): Promise<Listing[]> {
  const snap = await getDocs(collection(db, "users", uid, "listings"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
}

export async function addListing(uid: string, listing: Omit<Listing, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", uid, "listings"), {
    ...listing,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateListing(uid: string, listingId: string, updates: Partial<Omit<Listing, "id" | "createdAt">>) {
  await updateDoc(doc(db, "users", uid, "listings", listingId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteListing(uid: string, listingId: string) {
  await deleteDoc(doc(db, "users", uid, "listings", listingId));
}

// ─── Financial Data ───────────────────────────────────────────────────────────

export async function getFinancialData(uid: string, listingId: string): Promise<FinancialData | null> {
  const snap = await getDoc(doc(db, "users", uid, "financials", listingId));
  return snap.exists() ? (snap.data() as FinancialData) : null;
}

export async function setFinancialData(uid: string, listingId: string, data: FinancialData) {
  await setDoc(doc(db, "users", uid, "financials", listingId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(uid: string, listingId: string): Promise<Expense[]> {
  const snap = await getDocs(collection(db, "users", uid, "expenses", listingId, "items"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
}

export async function addExpense(uid: string, listingId: string, expense: Omit<Expense, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "users", uid, "expenses", listingId, "items"), expense);
  return ref.id;
}

export async function deleteExpense(uid: string, listingId: string, expenseId: string) {
  await deleteDoc(doc(db, "users", uid, "expenses", listingId, "items", expenseId));
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function getBookings(uid: string, listingId: string): Promise<FSBooking[]> {
  const snap = await getDocs(collection(db, "users", uid, "bookings", listingId, "items"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FSBooking));
}

export async function addBooking(uid: string, listingId: string, booking: Omit<FSBooking, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "users", uid, "bookings", listingId, "items"), booking);
  return ref.id;
}

export async function updateBooking(uid: string, listingId: string, bookingId: string, updates: Partial<Omit<FSBooking, "id">>) {
  await updateDoc(doc(db, "users", uid, "bookings", listingId, "items", bookingId), updates);
}

export async function deleteBooking(uid: string, listingId: string, bookingId: string) {
  await deleteDoc(doc(db, "users", uid, "bookings", listingId, "items", bookingId));
}

// ─── Marketing Emails ─────────────────────────────────────────────────────────

export async function saveMarketingEmail(email: string, source: string = "landing") {
  await addDoc(collection(db, "marketingEmails"), {
    email: email.trim().toLowerCase(),
    source,
    createdAt: serverTimestamp(),
  });
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export async function getReferrals(uid: string, listingId: string): Promise<FSReferral[]> {
  const snap = await getDocs(collection(db, "users", uid, "referrals", listingId, "items"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FSReferral));
}

export async function addReferral(uid: string, listingId: string, referral: Omit<FSReferral, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "users", uid, "referrals", listingId, "items"), referral);
  return ref.id;
}

export async function updateReferral(uid: string, listingId: string, referralId: string, updates: Partial<Omit<FSReferral, "id">>) {
  await updateDoc(doc(db, "users", uid, "referrals", listingId, "items", referralId), updates);
}

export async function deleteReferral(uid: string, listingId: string, referralId: string) {
  await deleteDoc(doc(db, "users", uid, "referrals", listingId, "items", referralId));
}

// ─── Calendar Sources ─────────────────────────────────────────────────────────

export async function getCalendarSources(uid: string, listingId: string): Promise<FSCalendarSource[]> {
  const snap = await getDoc(doc(db, "users", uid, "calendarSources", listingId));
  if (!snap.exists()) return [];
  const data = snap.data();
  return Array.isArray(data?.sources) ? (data.sources as FSCalendarSource[]) : [];
}

export async function setCalendarSources(uid: string, listingId: string, sources: FSCalendarSource[]) {
  await setDoc(doc(db, "users", uid, "calendarSources", listingId), {
    sources,
    updatedAt: serverTimestamp(),
  });
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

export async function getCalendarEvents(uid: string, listingId: string): Promise<CalendarEvent[]> {
  const snap = await getDocs(collection(db, "users", uid, "calendar", listingId, "events"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
}

export async function addCalendarEvent(uid: string, listingId: string, event: Omit<CalendarEvent, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "users", uid, "calendar", listingId, "events"), {
    ...event,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCalendarEvent(uid: string, listingId: string, eventId: string, updates: Partial<Omit<CalendarEvent, "id" | "createdAt">>) {
  await updateDoc(doc(db, "users", uid, "calendar", listingId, "events", eventId), updates);
}

export async function deleteCalendarEvent(uid: string, listingId: string, eventId: string) {
  await deleteDoc(doc(db, "users", uid, "calendar", listingId, "events", eventId));
}
