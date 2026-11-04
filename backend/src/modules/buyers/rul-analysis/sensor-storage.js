const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const STORAGE_ROOT = path.resolve(
    process.env.SENSOR_STORAGE_ROOT ||
    path.join(process.cwd(), "storage", "sensors")
);

async function saveSensorFile({
    engineId,
    fileName,
    csvContent,
}) {
    if (!csvContent || typeof csvContent !== "string") {
        throw new Error("Invalid sensor CSV content.");
    }

    const safeName = path.basename(fileName).replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
    );

    const fileId = crypto.randomUUID();

    const objectKey =
        `uploads/${engineId}/${fileId}_${safeName}`;

    const absolutePath = path.resolve(
        STORAGE_ROOT,
        objectKey
    );

    if (
        !absolutePath.startsWith(STORAGE_ROOT + path.sep)
    ) {
        throw new Error("Invalid sensor storage path.");
    }

    await fs.mkdir(path.dirname(absolutePath), {
        recursive: true,
    });

    await fs.writeFile(
        absolutePath,
        csvContent,
        "utf8"
    );

    const fileSha256 = crypto
        .createHash("sha256")
        .update(csvContent)
        .digest("hex");

    return {
        objectKey,
        fileSha256,
    };
}

async function readSensorFile(objectKey) {
    const absolutePath = path.resolve(
        STORAGE_ROOT,
        objectKey
    );

    if (
        !absolutePath.startsWith(STORAGE_ROOT + path.sep)
    ) {
        throw new Error("Invalid sensor storage path.");
    }

    return fs.readFile(absolutePath, "utf8");
}

async function deleteSensorFile(objectKey) {
    const absolutePath = path.resolve(
        STORAGE_ROOT,
        objectKey
    );

    if (
        !absolutePath.startsWith(STORAGE_ROOT + path.sep)
    ) {
        throw new Error("Invalid sensor storage path.");
    }

    await fs.rm(absolutePath, { force: true });
}

module.exports = {
    saveSensorFile,
    readSensorFile,
    deleteSensorFile,
};