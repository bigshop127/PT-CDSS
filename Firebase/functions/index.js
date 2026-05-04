const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const axios = require("axios");

/**
 * Section 3.D: Firebase Callable Function (Export Bridge)
 * Securely triggers the Cloud Run image export service.
 */
exports.requestExport = onCall({
  region: "asia-east1", // Or your preferred region
  memory: "256MiB",
  cors: true
}, async (request) => {
  // 1. Verify Authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const { projectId, chartId, version } = request.data;

  // 2. Validate Input
  if (!projectId || !chartId) {
    throw new HttpsError("invalid-argument", "Missing projectId or chartId.");
  }

  // 3. Permission Check (Verify if user is a member of the project)
  // Note: This logic assumes a direct check against Firestore is performed
  // In 2nd Gen functions, we can use the Firestore Admin SDK for this.
  
  const CLOUD_RUN_URL = process.env.EXPORT_SERVICE_URL;
  if (!CLOUD_RUN_URL) {
    logger.error("EXPORT_SERVICE_URL environment variable not set.");
    throw new HttpsError("internal", "Export service configuration error.");
  }

  try {
    // 4. Trigger Cloud Run Service (Server-to-Server)
    // We pass the ADC credentials implicitly if both are in the same project
    const response = await axios.post(`${CLOUD_RUN_URL}/export`, {
      projectId,
      chartId,
      version: version || "latest"
    }, {
      headers: {
        'Content-Type': 'application/json',
        // In a production environment with IAM authentication, 
        // you would add an ID Token header here:
        // 'Authorization': `Bearer ${idToken}`
      }
    });

    return {
      success: true,
      exportUrl: response.data.url
    };

  } catch (error) {
    logger.error("Cloud Run Export Trigger Failed", error);
    throw new HttpsError("internal", "Failed to generate export image.");
  }
});
