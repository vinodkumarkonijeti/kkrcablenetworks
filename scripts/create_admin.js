/**
 * Script to create an admin user using Firebase Admin SDK.
 *
 * Usage:
 * 1. Download a service account JSON from Firebase Console (Project Settings -> Service accounts).
 * 2. Save it locally, e.g. `./serviceAccountKey.json`.
 * 3. Run: `node scripts/create_admin.js ./serviceAccountKey.json vinodkumarkonijeti@gmail.com Vinod@5099`
 *
 * This will create the auth user and set a document in `users/{uid}` with role 'admin'.
 */

const admin = require('firebase-admin');
const fs = require('fs');

async function main() {
  const [,, serviceAccountPath, email, password] = process.argv;
  if (!serviceAccountPath || !email || !password) {
    console.error('Usage: node scripts/create_admin.js <serviceAccount.json> <email> <password>');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const auth = admin.auth();
  const db = admin.firestore();

  try {
    // Create user in Auth
    const userRecord = await auth.createUser({ email, password });
    console.log('Created user:', userRecord.uid);

    // Create users doc
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role: 'admin',
      firstName: 'Admin',
      lastName: '',
      phoneNumber: '',
      occupation: 'Admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Admin user created and users doc written. You can now login with the credentials.');
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

main();
