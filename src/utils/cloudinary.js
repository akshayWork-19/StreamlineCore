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
    //after that remove the file 
    fs.unlinkSync(localFilePath);
    return response;

  } catch (error) {
    fs.unlinkSync(localFilePath);//remove the locally saved temporary file as upload failed!.;
    return null;
  }
}

//
// http://res.cloudinary.com/youtubebackend1/image/upload/v1759849949/vrdou5qjhu3cy8wccy8n.jpg

const deleteAssest = async (fileToDeleteCompleteUrl) => {
  try {
    //extract the public id of file from fileToDeleteCompleteUrl,because using publicId we can delete otherwise maybe not
    const uploadIndex = fileToDeleteCompleteUrl.indexOf('/upload/');
    if (uploadIndex == -1) {
      throw new ApiError(401, "File doesn't exists/Invalid Url :: deleteAsset");
      return null;
    }
    const pathWithVersion = fileToDeleteCompleteUrl.substring(uploadIndex + 8);
    const pathSegments = pathWithVersion.split('/');
    const publicIdSegment = pathSegments[1];
    const publicId = publicIdSegment?.split('.')[0];
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    return null;
  }


}


export { uploadOnCloudinary, deleteAssest };
