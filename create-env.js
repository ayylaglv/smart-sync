const fs = require("fs");

// Define the content of environment.ts
const environmentContent = `
export const environment = {
  production: ${process.env.production || true},
  firebase: {
    apiKey: '${process.env.apiKey || ""}',
    authDomain: '${process.env.authDomain || ""}',
    projectId: '${process.env.projectId || ""}',
    storageBucket: '${process.env.storageBucket || ""}',
    messagingSenderId: '${process.env.messagingSenderId || ""}',
    appId: '${process.env.appId || ""}',
  },
  geminiApiKey: '${process.env.geminiApiKey || ""}',
};
`;

// Ensure the environments directory exists
const dir = "./src/environments";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write the environment file
fs.writeFileSync("./src/environments/environment.ts", environmentContent);
fs.writeFileSync("./src/environments/environment.prod.ts", environmentContent);

console.log("Environment files created successfully!");
