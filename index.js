var path = require('path');
var Promise = require('promise');
var gm = require('gm').subClass({ imageMagick: true }); // Enable ImageMagick integration.
var execute = require('lambduh-execute');
var validate = require('lambduh-validate');
var s3Download = require('lambduh-get-s3-object');
var upload = require('lambduh-put-s3-object');
//var downloadFile = require('lambduh-download-file');

var enableTitle = true; //set to false if you don't need to write unique text to your thumb image
var doUpload = true; //set to false if you don't want to upload avi for testing

process.env['PATH'] = process.env['PATH'] + ':/tmp/:' + process.env['LAMBDA_TASK_ROOT'];

function delay(t, val) {
   return new Promise(function(resolve) {
       setTimeout(function() {
           resolve(val);
       }, t);
   });
}

exports.handler = async function(event, context) {

  //hard coding values here - naughty, but this is for my personal use case sorry :(
  var title = {kern: 1, size: 66, color: '#000000', text: event.titleText, font: 'fonts/font.otf'};

  var k = await validate(event, {
    "srcMP3Key": true, //name of file in bucket of mp3
    "srcThumbKey": true, //name of jpeg file to use as template
    "srcBucket": true, //name of bucket
    "titleText": enableTitle //string of text to write on image
  });

  var fdname = path.basename(event.srcMP3Key);
  var aviname = fdname.split('.mp3')[0] + '.avi';
  var tloc = '/tmp/thumb.jpg';
  var tlocw = '/tmp/thumbw.jpg';


  var kkf = await execute(event, {
    shell: "cp bin/f4 /tmp/.; chmod 755 /tmp/f4; cp bin/ffmpeg /tmp/.; chmod 755 /tmp/ffmpeg; cp bin/mp3info /tmp/.; chmod 755 /tmp/mp3info;"
  });

  var kk = await s3Download(event, {
  srcBucket: event.srcBucket,
  srcKey: event.srcThumbKey,
  downloadFilepath: tloc
  });

  var kkk = await s3Download(event, {
  srcBucket: event.srcBucket,
  srcKey: event.srcMP3Key,
  downloadFilepath: '/tmp/track.mp3'
  });


  var jj = await gm(tloc)
  .region(1280, 720, 0, 0) //WIDTH, HEIGHT, X, Y
  .gravity('Center')
  .fill(title.color)
  .fontSize(title.size)
  .in('-kerning', title.kern)
  .font(title.font)
  .drawText(0, 80, title.text)
  .write(tlocw, function (err) {
    if (!err) {
      console.log('graphicsmagick written');
      ////
    }
  });

  var pp = await delay(2000);

  var jjj = await upload(event, {
    dstBucket: event.srcBucket,
    dstKey: fdname.split('.mp3')[0] + '.jpg',
    uploadFilepath: tlocw
  });

  if(doUpload) {
    var kkkk = await execute(event, {
      bashScript: '/tmp/f4',
      bashParams: [
        '/tmp/track.mp3', //input files
        tlocw, //thumb
        '/tmp/video.avi' //output filename
      ],
      logOutput: true
    });
    var kkkkk = await upload(event, {
      dstBucket: event.srcBucket,
      dstKey: aviname,
      uploadFilepath: '/tmp/video.avi'
    });
  }

  var kkkkkk = await execute(event, {
    shell: "rm /tmp/*;"
  });

  console.log('finished');

  return aviname;
}