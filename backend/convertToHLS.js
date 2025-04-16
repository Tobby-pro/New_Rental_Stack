// convertToHLS.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Converts a video file to HLS (.m3u8) format using FFmpeg.
 * @param {string} inputPath - Full path to the input video file.
 * @param {string} outputDir - Directory where HLS files will be saved.
 * @returns {Promise<string[]>} - A list of full paths to the generated HLS files.
 */
const convertToHLS = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    // Make sure the output directory exists
    fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'index.m3u8');
    const ffmpegCmd = `ffmpeg -i "${inputPath}" -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls "${outputPath}"`;

    exec(ffmpegCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg conversion error:', stderr);
        return reject(error);
      }

      const files = fs.readdirSync(outputDir).map(file => path.join(outputDir, file));
      resolve(files);
    });
  });
};

module.exports = convertToHLS;
