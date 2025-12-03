import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn("Cloudinary environment variables are missing.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export function uploadBuffer(buffer: Buffer, filename?: string, folder?: string) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder,
      filename_override: filename,
      overwrite: false,
      resource_type: "image",
    }, (error, result) => {
      if (error || !result) {
        reject(error);
      } else {
        resolve(result);
      }
    });

    stream.end(buffer);
  });
}
