const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");
const Chiperline = require("chiperline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the path to the directory: ", (directoryPath) => {
  rl.question("Enter the encryption key: ", (cipherline) => {
    encryptDirectory(directoryPath, cipherline)
      .then(() => {
        console.log("Encryption completed.");
        rl.close();
      })
      .catch((error) => {
        console.error(error);
        rl.close();
      });
  });
});

function chiperenc(data, key) {
  const chiper = new Chiperline(key);
  return chiper.encrypt(data);
}
// Simple XOR encryption function
function xorEncrypt(data, key) {
  let encrypted = "";
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return encrypted;
}

// Function to convert base64 string to Buffer
function base64ToBuffer(base64) {
  return Buffer.from(base64, "base64");
}

// Function to encrypt a single file
async function encryptFile(filePath, cipherline) {
  try {
    const fileContent = await fs.readFile(filePath, "base64");

    // Encrypt the base64 string using the provided cipherline
    const encryptedData = chiperenc(fileContent, cipherline);

    // Convert the encrypted data back to a Buffer
    const encryptedBuffer = base64ToBuffer(
      Buffer.from(encryptedData).toString("base64")
    );

    // Encrypt the file name
    const fileName = path.basename(filePath);
    const encryptedFileName = Buffer.from(
      xorEncrypt(fileName, cipherline)
    ).toString("base64").replace(/\//g, '_');

    // Save the encrypted file
    const dirName = path.dirname(filePath);
    const encryptedFilePath = path.join(dirName, encryptedFileName);

    await fs.writeFile(encryptedFilePath, encryptedBuffer);
    console.log(`Encrypting File ${fileName}`)
    // console.log(`Encrypted file saved as: ${encryptedFilePath}`);
  } catch (error) {
    console.error("Error encrypting file:", error);
    throw error;
  }
}

// Function to encrypt all files in a directory recursively
async function encryptDirectory(directoryPath, cipherline) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (let entry of entries) {
      console.log("Encrypting Folder ",entry.name)
      const fullPath = path.join(directoryPath, entry.name);
      console.log(fullPath)

      if (entry.isDirectory()) {
        // Encrypt the directory name
        const encryptedDirName = Buffer.from(
          xorEncrypt(entry.name, cipherline)
        ).toString("base64").replace(/\//g, '_');
        const encryptedDirPath = path.join(directoryPath, encryptedDirName);
        
        // Rename the directory
        await fs.rename(fullPath, encryptedDirPath);
        console.log(`Encrypted directory name to: ${encryptedDirPath}`);

        // Recursively process the directory
        await encryptDirectory(encryptedDirPath, cipherline);
      } else if (entry.isFile()) {
        // Encrypt the file
        await encryptFile(fullPath, cipherline);

        // Remove the original file after encryption
        await fs.unlink(fullPath);
      }
    }
  } catch (error) {
    console.error("Error processing directory:", error);
    throw error;
  }
}

// Setup readline for command line input
