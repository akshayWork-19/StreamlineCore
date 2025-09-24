import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: String(process.env.CLOUD_NAME),
  api_key: String(process.env.CLOUDINARY_API_KEY),
  api_secret: String(process.env.CLOUDINARY_API_SECRET),
})

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary,we can actually encrypt our file here as well before uploading 
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    //file has been uploaded successfully
    console.log('File has uploaded successfully!', response.url);
    return response;

  } catch (error) {
    fs.unlinkSync(localFilePath);//remove the locally saved temporary file as upload failed!.
    return null;
  }
}


export { uploadOnCloudinary };
