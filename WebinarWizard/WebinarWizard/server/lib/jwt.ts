import jwt from "jsonwebtoken";

export function generateJWT(roomName: string): string {
  // Ensure all required environment variables are set
  const apiKey = process.env.JITSI_API_KEY;
  const appId = process.env.JITSI_APP_ID;
  const privateKey = process.env.JITSI_PRIVATE_KEY;

  if (!apiKey || !appId || !privateKey) {
    throw new Error("Missing required Jitsi environment variables");
  }

  // Extract the key ID from the API key (everything after the last '/')
  const kid = apiKey.split('/').pop();
  if (!kid) {
    throw new Error("Invalid API key format");
  }

  // Construct the JWT payload according to Jitsi's requirements
  const payload = {
    aud: "jitsi",
    iss: "chat",
    sub: kid, // Use the kid as the subject
    room: roomName,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    context: {
      user: {
        moderator: true,
        name: "Meeting Host",
        id: "host",
        avatar: "",
        email: ""
      },
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        "outbound-call": false
      }
    }
  };

  // Clean up the private key to ensure proper PEM format
  let formattedPrivateKey = privateKey
    .replace(/\\n/g, '\n')
    .trim();

  // Ensure private key has proper PEM format
  if (!formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${formattedPrivateKey}\n-----END PRIVATE KEY-----`;
  }

  try {
    return jwt.sign(payload, formattedPrivateKey, { 
      algorithm: "RS256",
      header: {
        kid
      }
    });
  } catch (error) {
    console.error('JWT signing error:', error);
    throw error;
  }
}