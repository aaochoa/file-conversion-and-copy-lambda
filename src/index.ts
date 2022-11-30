import * as cmd from 'child_process';
import * as fileSysEx from 'fs-extra';
import * as path from 'path';
import * as util from 'util';

import { AWSTools } from './utils/aws.wrapper';

export const handler = async (data: any) => {
  const { userFolderName, folderName, audios } = data;
  const tmpDirPath = path.join(__dirname, `../tmp/${userFolderName}/`);
  const s3FileLocation = `${userFolderName}/${folderName}`;
  const exec = util.promisify(cmd.exec);
  const convertedFiles: any = [];
  fileSysEx.ensureDirSync(tmpDirPath);

  for (let audio of audios) {
    let fileExists = await AWSTools.fileExistsS3(userFolderName, audio.fileName);
    if (fileExists) {
      let tmpFilePath = `${tmpDirPath}${audio.fileName}`;
      let bufferAudio = await AWSTools.downloadFromS3(userFolderName, audio.fileName);
      fileSysEx.outputFileSync(tmpFilePath, bufferAudio);
      let wavFileName = audio.fileName.replace('.pcm', '.wav');
      let wavFilePath = `${tmpDirPath}${wavFileName}`;
      let { stdout, stderr } = await exec(`sox -t raw -c 1 -b 8 -r 8000 -e mu-law ${tmpFilePath} ${wavFilePath}`);
      if (stderr !== undefined && stderr !== null && stderr !== "" && stderr.indexOf("sox WARN") == -1) {
        throw new Error(`${stdout} ${stderr}`);
      }
      let wavBuffer = fileSysEx.readFileSync(wavFilePath);
      let audioResult = await AWSTools.uploadToS3(s3FileLocation, wavFileName, wavBuffer);
      convertedFiles.push(audioResult);
    }
  }
  fileSysEx.removeSync(tmpDirPath);

  return convertedFiles; 
};
