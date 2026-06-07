import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, getDocFromServer, increment, serverTimestamp, writeBatch, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

// Using initializeFirestore with memory cache settings to avoid IDB issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache()
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let userFriendlyMessage = "An unexpected database error occurred.";
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes('unavailable') || errorMsg.includes('network') || errorMsg.includes('offline') || (error as any).code === 'unavailable') {
      userFriendlyMessage = "Network error: The operation failed. Please check your internet connection and try again.";
    } else if (errorMsg.includes('permission-denied') || (error as any).code === 'permission-denied') {
      userFriendlyMessage = "Permission denied: You do not have access to perform this operation.";
    } else {
      userFriendlyMessage = `Error performing ${operationType}: ${error.message}`;
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
      providerId: provider.providerId,
      displayName: provider.displayName,
      email: provider.email,
      photoUrl: provider.photoURL
    })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error:', userFriendlyMessage, JSON.stringify(errInfo));
  return userFriendlyMessage;
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export const deleteShopAllData = async (shopId: string) => {
  if (!shopId) return;
  const collectionsToClear = [
    'products', 'sales', 'customers', 'customer_orders', 'categories', 
    'users', 'employees', 'expenses', 'investments', 'staff_salaries', 
    'stockRecords', 'branches', 'recycleBin', 'customer_logs', 
    'due_payments', 'notes', 'warranty_records', 'daily_closings',
    'suppliers'
  ];

  const failures: string[] = [];

  for (const collName of collectionsToClear) {
    try {
      const q = query(collection(db, collName), where('shopId', '==', shopId));
      const snap = await getDocs(q);
      const batchPromises = snap.docs.map(docSnap => deleteDoc(doc(db, collName, docSnap.id)));
      await Promise.all(batchPromises);
    } catch (err) {
      console.error(`Error deleting shop records in collection: ${collName}`, err);
      failures.push(collName);
    }
  }

  // Also try clearing records in collections where the field might be nested or named slightly differently
  // E.g., user profiles or specific items
  try {
    const qSettings = doc(db, 'settings', shopId);
    await deleteDoc(qSettings);
  } catch (err) {
    console.error('Error deleting settings doc:', err);
    failures.push('settings doc');
  }

  try {
    const qShop = doc(db, 'shops', shopId);
    await deleteDoc(qShop);
  } catch (err) {
    console.error('Error deleting shop doc:', err);
    failures.push('shop doc');
  }

  if (failures.length > 0) {
    throw new Error(`Failed to delete some records from collection(s): ${failures.join(', ')}. Please check your admin privileges in firestore.rules.`);
  }
};

export { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, onSnapshot, signInWithPopup, signOut, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, increment, serverTimestamp, writeBatch
};
