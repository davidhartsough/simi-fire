import { getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs as fsGetDocs,
  arrayUnion,
  arrayRemove,
  DocumentData,
  DocumentReference,
  setDoc as fsSetDoc,
  doc,
  addDoc as fsAddDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  onSnapshot,
  getDoc as fsGetDoc,
  QueryConstraint,
  writeBatch,
  WriteBatch,
  DocumentChange,
  FieldPath,
  documentId,
  Unsubscribe,
} from "firebase/firestore";

import { chunk } from "./utils";

export function generateId(collectionName: string): string {
  const db = getFirestore(getApp());
  return doc(collection(db, collectionName)).id;
}

export function docRef(collectionName: string, id: string): DocumentReference {
  const db = getFirestore(getApp());
  return doc(db, collectionName, id);
}

export async function getDoc(
  collectionName: string,
  id: string
): Promise<DocumentData | null> {
  const db = getFirestore(getApp());
  const docSnap = await fsGetDoc(doc(db, collectionName, id));
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  }
  return null;
}

export async function getDocs(
  collectionName: string,
  queryConstraint: QueryConstraint
): Promise<DocumentData[]> {
  const db = getFirestore(getApp());
  const q = query(collection(db, collectionName), queryConstraint);
  const querySnap = await fsGetDocs(q);
  return querySnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function addDoc(
  collectionName: string,
  doc: DocumentData
): Promise<string> {
  const db = getFirestore(getApp());
  const docRef = await fsAddDoc(collection(db, collectionName), doc);
  return docRef.id;
}

export async function setDoc(
  collectionName: string,
  id: string,
  data: DocumentData,
  merge = false
): Promise<boolean> {
  const db = getFirestore(getApp());
  await fsSetDoc(doc(db, collectionName, id), data, { merge });
  return true;
}

export async function updateDoc(
  collectionName: string,
  id: string,
  data: any
): Promise<boolean> {
  const db = getFirestore(getApp());
  await fsUpdateDoc(doc(db, collectionName, id), data);
  return true;
}

export async function deleteDoc(
  collectionName: string,
  id: string
): Promise<boolean> {
  const db = getFirestore(getApp());
  await fsDeleteDoc(doc(db, collectionName, id));
  return true;
}

export function qWhereEquals(field: string, value: string): QueryConstraint {
  return where(field, "==", value);
}

export function qWhereContains(field: string, value: string): QueryConstraint {
  return where(field, "array-contains", value);
}

/**
 * Query Where In
 * @param field string | FieldPath
 * @param value string[] - max length of 10
 * @returns QueryConstraint
 */
export function qWhereIn(
  field: string | FieldPath,
  value: string[]
): QueryConstraint {
  return where(field, "in", value);
}

export function watchChanges(
  collectionName: string,
  queryConstraint: QueryConstraint,
  changeHandler: (change: DocumentChange) => void
): Unsubscribe {
  const db = getFirestore(getApp());
  const q = query(collection(db, collectionName), queryConstraint);
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(changeHandler);
  });
}

export interface DocumentDataWithId extends DocumentData {
  id: string;
}
export type NonNullDocChangeHandler = (data: DocumentDataWithId) => void;
export type DocChangeHandler = (doc: DocumentDataWithId | null) => void;

export function handleCollectionChanges(
  collectionName: string,
  queryConstraint: QueryConstraint,
  add: NonNullDocChangeHandler,
  modify: NonNullDocChangeHandler,
  remove: (id: string) => void
) {
  watchChanges(collectionName, queryConstraint, ({ type, doc }) => {
    const { fromCache, hasPendingWrites } = doc.metadata;
    if (fromCache || hasPendingWrites) return;
    if (type === "removed") remove(doc.id);
    if (doc.exists()) {
      const data = { id: doc.id, ...doc.data() };
      if (type === "added") add(data);
      if (type === "modified") modify(data);
    }
  });
}

export function watchBulkChanges(
  collectionName: string,
  queryConstraint: QueryConstraint,
  changesHandler: (change: DocumentChange[]) => void
): Unsubscribe {
  const db = getFirestore(getApp());
  const q = query(collection(db, collectionName), queryConstraint);
  return onSnapshot(q, (snapshot) => {
    changesHandler(snapshot.docChanges());
  });
}

export function watchDocChanges(
  collectionName: string,
  id: string,
  snapshotHandler: (docData: DocumentData | null) => void
): Unsubscribe {
  const db = getFirestore(getApp());
  const docRef = doc(db, collectionName, id);
  return onSnapshot(docRef, (snapshot) => {
    const { fromCache, hasPendingWrites } = snapshot.metadata;
    if (fromCache || hasPendingWrites) return;
    const docData = snapshot.exists() ? snapshot.data() : null;
    snapshotHandler(docData);
  });
}

export function handleDocChanges(
  collectionName: string,
  id: string,
  handler: DocChangeHandler
) {
  watchDocChanges(collectionName, id, (docData) => {
    if (!docData) return handler(null);
    handler({ ...docData, id });
  });
}

export function batchWrite(): WriteBatch {
  const db = getFirestore(getApp());
  return writeBatch(db);
}

export { arrayUnion, arrayRemove, documentId };

export async function getDocsByIds(
  collectionName: string,
  docIds: string[],
  chunkSize = 10
): Promise<DocumentDataWithId[]> {
  const data: DocumentDataWithId[] = [];
  for (const batchIds of chunk(docIds, chunkSize)) {
    const fetchedDoc = (await getDocs(
      collectionName,
      qWhereIn(documentId(), batchIds)
    )) as DocumentDataWithId[];
    data.push(...fetchedDoc);
  }
  return data;
}

export type Docs = DocumentDataWithId[] | any[];

export async function addDocs(
  collectionName: string,
  inputs: any[]
): Promise<Docs> {
  const data: DocumentDataWithId[] = [];
  const batch = batchWrite();
  inputs.forEach((input) => {
    const newDoc = {
      ...input,
      id: generateId(collectionName),
    };
    batch.set(
      docRef(collectionName, newDoc.id),
      (({ id, ...rest }) => rest)(newDoc)
    );
    data.push(newDoc);
  });
  await batch.commit();
  return data;
}

export async function setDocs(
  collectionName: string,
  docs: DocumentDataWithId[] | any[]
): Promise<boolean> {
  const batch = batchWrite();
  docs.forEach((doc) => {
    batch.set(docRef(collectionName, doc.id), (({ id, ...rest }) => rest)(doc));
  });
  await batch.commit();
  return true;
}

export async function deleteDocs(
  collectionName: string,
  docIds: string[]
): Promise<boolean> {
  const batch = batchWrite();
  docIds.forEach((docId) => {
    batch.delete(docRef(collectionName, docId));
  });
  await batch.commit();
  return true;
}
