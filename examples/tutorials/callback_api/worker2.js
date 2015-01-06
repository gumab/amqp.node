
var amqp = require('amqplib/callback_api');
var fs = require('extfs');
var http = require('http');

var basePath = 'goodsdaq_image/goods_image2/';
var path;
var nas = ['/gdimg1_ifs/gdimg1/', '/gdimg3_ifs/gdimg3/', '/gdimg4_ifs/gdimg4/', '/gdimg5_ifs/gdimg5/'];
var basicFolder = ['middle_img', 'middle_img2', 'middle_img3', 'middle_jpgimg', 'middle_jpgimg2', 'middle_jpgimg3', 'gallery_img', 'gallery_jpgimg', 'large_img', 'large_jpgimg', 'exlarge_img', 'qrcode_img', 'shop_img', 'small_img', 'small_img2', 'small_jpgimg'];
var goodNo = ['643145121', '643145142', '643145169', '643145244', '643145988', '643145918', '643145919', '643145920', '643145921', '643145922', '643145923', '643145924', '643145925', '643145926', '643145927', '643145928', '643145929', '643145930'];
var upPath;


function bail(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}

function on_connect(err, conn) {
  if (err !== null) return bail(err);
  process.once('SIGINT', function() { conn.close(); });
  
  var q = 'task_queue';

  conn.createChannel(function(err, ch) {
    if (err !== null) return bail(err, conn);
    ch.assertQueue(q, {durable: true}, function(err, _ok) {
      ch.consume(q, doWork, {noAck: false});
      console.log(" [*] Waiting for messages. To exit press CTRL+C");
    });

    function doWork(msg) {
        var jsonObj = JSON.parse(msg.content);
        var goodNo=jsonObj.goods_no;
        console.log('Goods No : ' + goodNo);
        for (var j = 0; j < basicFolder.length; j++) {
            console.log(basicFolder[j]);
            path = getPath(goodNo, j);
            if (fs.existsSync(path)) {
                fs.unlink(path, function (err) {
                    if (err) throw err;
                    console.log("deleted img!");
                });

                console.log(true);
            }
            else {
                console.log(false);
            }
            //console.log(path);

        }

      var body = msg.content.toString();
      //console.log(" [x] Received '%s'", body);
      var secs = body.split('.').length - 1;
      setTimeout(function() {
        console.log(" [x] Done");
        ch.ack(msg);
      }, secs * 1000);
    }
  });
}

amqp.connect(on_connect);


function getPath(goodNo, j) {
    return nas[0] + basePath + basicFolder[j] + '/' + goodNo.substring(0, 3) + '/' + goodNo.substring(3, 6) + '/' + goodNo + '.jpg';
}

function getUpperPath(path) {
    var index = path.substring(0, path.length - 1).lastIndexOf('/');
    return path.substring(0, index);
}
