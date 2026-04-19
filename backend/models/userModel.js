/**
 * User Model — Week 1 Backend Task 4 + Week 2 Task 1
 *
 * Handles Firestore operations for the 'users' collection.
 * Used by: authController.js
 */

const { db } = require('../config/firebase');

const COLLECTION = 'users';

/**
 * Creates a new user document in Firestore.
 * @param {string} uid - Firebase Auth UID
 * @param {object} data - { name, email, phone, role }
 */
const createUser = async (uid, data) => {
  const user = {
    uid,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    role: data.role || 'customer', // customer | driver | admin | garage
    createdAt: new Date().toISOString(),
  };
  await db.collection(COLLECTION).doc(uid).set(user);
  return user;
};

/**
 * Fetches a user by UID.
 * @param {string} uid
 * @returns {object|null}
 */
const getUserById = async (uid) => {
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

/**
 * Fetches a user by email.
 * @param {string} email
 * @returns {object|null}
 */
const getUserByEmail = async (email) => {
  const snapshot = await db
    .collection(COLLECTION)
    .where('email', '==', email)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * Updates a user document.
 * @param {string} uid
 * @param {object} updates
 */
const updateUser = async (uid, updates) => {
  await db.collection(COLLECTION).doc(uid).update(updates);
};

module.exports = { createUser, getUserById, getUserByEmail, updateUser };
