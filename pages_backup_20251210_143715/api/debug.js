// pages/api/debug.js
export default function handler(req, res) {
  // Get the database URL from environment variables
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    // For security, let's not expose the full password.
    // We'll just check if it exists and show parts of it.
    const urlParts = new URL(dbUrl);
    const censoredUrl = `${urlParts.protocol}//${urlParts.username}:[PASSWORD_CENSORED]@[${urlParts.hostname}]:${urlParts.port}${urlParts.pathname}`;
    
    res.status(200).json({
      message: "DATABASE_URL is set.",
      value: censoredUrl
    });
  } else {
    res.status(500).json({
      message: "Error: DATABASE_URL is NOT found in environment variables."
    });
  }
}
