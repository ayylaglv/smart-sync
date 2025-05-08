const fs = require("fs");

const environmentContent = `
export const environment = {
  production: ${process.env.production || false},
  geminiApiKey: '${process.env.geminiApiKey || ""}',
  firebaseConfig: {
    apiKey: '${process.env.apiKey || ""}',
    authDomain: '${process.env.authDomain || ""}',
    projectId: '${process.env.projectId || ""}',
    storageBucket: '${process.env.storageBucket || ""}',
    messagingSenderId: '${process.env.messagingSenderId || ""}',
    appId: '${process.env.appId || ""}',
  }
};
`;

const dir = "./src/environments";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync("./src/environments/environment.ts", environmentContent);
fs.writeFileSync("./src/environments/environment.prod.ts", environmentContent);
