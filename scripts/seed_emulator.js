import admin from 'firebase-admin';

// Explicitly set emulator environment variables
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'pt-cdss'
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function seed() {
  console.log("Seeding Emulator Data...");

  const testUserId = 'user-123';
  const testProjectId = 'test-project';

  // 1. Create a dummy user in Auth Emulator
  try {
    await auth.getUser(testUserId);
    console.log(`User ${testUserId} already exists.`);
  } catch (e) {
    try {
      await auth.createUser({
        uid: testUserId,
        email: 'test@example.com',
        password: 'password123'
      });
      console.log(`Created test user: ${testUserId}`);
    } catch (createErr) {
      console.error("Error creating user:", createErr);
    }
  }

  // 2. Create the project document in Firestore
  const projectRef = db.collection('projects').doc(testProjectId);
  await projectRef.set({
    name: "Test PT Project",
    owner_id: testUserId,
    members: [testUserId],
    nodes: [
      {
        id: '1',
        type: 'default',
        data: { label: '病人主訴：頸部疼痛' },
        position: { x: 250, y: 5 }
      }
    ],
    edges: []
  }, { merge: true });

  console.log(`Ensured test project: ${testProjectId} exists with member: ${testUserId}`);
  console.log("Seeding complete!");
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
