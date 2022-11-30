import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';

dotenv.config()

export class AWSTools {    
  private static _instance: AWSTools;
  private _s3bucket:AWS.S3;

  private constructor() {
    let config = new AWS.Config({
        accessKeyId: process.env.AUDIO_S3_API_KEY,
        secretAccessKey: process.env.AUDIO_S3_SECRET,
        region: 'us-east-1'
    });
    this._s3bucket = new AWS.S3(config);
  }

  public static get S3() {
    this._instance = this._instance || (this._instance = new this());
    return this._instance._s3bucket;
  }

  public static async fileExistsS3(userFolderName:string, fileName: string) {
    const params = {
      Bucket: `${process.env.AUDIO_BUCKET_NAME}`,
      Key: `${userFolderName}/${fileName}`
    }
    try {
      await AWSTools.S3.headObject(params).promise();
      return true;
    } catch (err) {
      return false;
    }
  }
  
  public static async downloadFromS3(userFolderName: string, fileName: string) {
    const params = {
      Bucket: `${process.env.AUDIO_BUCKET_NAME}`,
      Key: `${userFolderName}/${fileName}`
    }
    let chunks: any = [];

    return new Promise((resolve, reject) => {
      AWSTools.S3.getObject(params).createReadStream()
      .on('error', (e) => {
          reject(e.message);
      })
      .on('data', (data) => {
          chunks.push(data);
      })
      .on('finish', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  public static async uploadToS3(fileLocation: string, fileName: string, audioBuffer: any) {
    const params = {
      Body: audioBuffer,
      Bucket: `${process.env.AUDIO_BUCKET_NAME}`,
      Key: `${fileLocation}/${fileName}`
    };

    return new Promise((resolve, reject) => {
      AWSTools.S3.upload(params, function (err, data) {
        if (err)
          reject(err.stack);
        resolve(data);
      });
    });
  }
}