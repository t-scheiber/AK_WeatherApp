const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
        process.env[key.trim()] = value;
      }
    }
  });
}

const openweatherApiKey = process.env.OPENWEATHER_API_KEY || "";

const configContent = `
const CONFIG = {
  OPENWEATHER_API_KEY: '${openweatherApiKey}'
};
`;

const configPath = path.join(__dirname, "config.js");
fs.writeFileSync(configPath, configContent, "utf8");
