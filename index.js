var path = require('path');

var execute = require('lambduh-execute');
var validate = require('lambduh-validate');
var s3Download = require('lambduh-get-s3-object');
var upload = require('lambduh-put-s3-object');
var downloadFile = require('lambduh-download-file');

process.env['PATH'] = process.env['PATH'] + ':/tmp/:' + process.env['LAMBDA_TASK_ROOT']

exports.handler = async function(event, context) {

  var k = await validate(event, {
    "srcMP3Key": true,
    "srcThumbKey": true,
    "srcBucket": true
  });

  var fdname = path.basename(event.srcMP3Key);
  var aviname = fdname.split('.mp3')[0] + '.avi';

  var kk = await s3Download(event, {
  srcBucket: event.srcBucket,
  srcKey: event.srcThumbKey,
  downloadFilepath: '/tmp/thumb.jpg'
  });

  var kkk = await s3Download(event, {
  srcBucket: event.srcBucket,
  srcKey: event.srcMP3Key,
  downloadFilepath: '/tmp/track.mp3'
  });

  var kkf = await execute(event, {
    shell: "cp bin/f4 /tmp/.; chmod 755 /tmp/f4; cp bin/ffmpeg /tmp/.; chmod 755 /tmp/ffmpeg; cp bin/mp3info /tmp/.; chmod 755 /tmp/mp3info;"
  });

  var kkkk = await execute(event, {
    bashScript: '/tmp/f4',
    bashParams: [
      '/tmp/track.mp3', //input files
      '/tmp/thumb.jpg', //thumb
      '/tmp/video.avi' //output filename
    ],
    logOutput: true
  });

  var kkkkk = await upload(event, {
    dstBucket: event.srcBucket,
    dstKey: aviname,
    uploadFilepath: '/tmp/video.avi'
  });

  var kkkkkk = await execute(event, {
    shell: "rm /tmp/*;"
  });

  console.log('finished');
  return aviname;
}