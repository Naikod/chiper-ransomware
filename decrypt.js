const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");
const Chiperline = require("chiperline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the path to the directory: ", (directoryPath) => {
  rl.question("Enter the decryption key: ", (cipherline) => {
    decryptDirectory(directoryPath, cipherline)
      .then(() => {
        console.log("Decryption completed.");
        rl.close();
      })
      .catch((error) => {
        console.error(error);
        rl.close();
      });
  });
});

function chiperdec(data, key) {
  const chiper = new Chiperline(key);
  return chiper.decrypt(data);
}

function xorDecrypt(data, key) {
  let decrypted = "";
  for (let i = 0; i < data.length; i++) {
    decrypted += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return decrypted;
}

function base64ToBuffer(base64) {
  return Buffer.from(base64, "base64");
}

async function decryptFile(filePath, cipherline) {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");

    const decryptedData = chiperdec(fileContent, cipherline);

    const decryptedBuffer = base64ToBuffer(decryptedData);

    const fileName = path.basename(filePath);
    const decryptedFileName = xorDecrypt(
      Buffer.from(fileName.replace(/_/g, "/"), "base64").toString(),
      cipherline
    );

    const dirName = path.dirname(filePath);
    const decryptedFilePath = path.join(dirName, decryptedFileName);

    await fs.writeFile(decryptedFilePath, decryptedBuffer);

    console.log(`Decrypted file saved as: ${decryptedFilePath}`);
  } catch (error) {
    console.error("Error decrypting file:", error);
    throw error;
  }
}

async function decryptDirectory(directoryPath, cipherline) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (let entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        const decryptedDirName = xorDecrypt(
          Buffer.from(entry.name.replace(/_/g, "/"), "base64").toString(),
          cipherline
        );
        const decryptedDirPath = path.join(directoryPath, decryptedDirName);

        await fs.rename(fullPath, decryptedDirPath);
        console.log(`Decrypted directory name to: ${decryptedDirPath}`);

        await decryptDirectory(decryptedDirPath, cipherline);
      } else if (entry.isFile()) {
        await decryptFile(fullPath, cipherline);

        await fs.unlink(fullPath);
      }
    }
  } catch (error) {
    console.error("Error processing directory:", error);
    throw error;
  }
}
