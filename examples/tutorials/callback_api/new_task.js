var amqp = require('amqplib/callback_api');
var i=0;
var obj = [{goods_no:'643145121', more_img:true, soho_img:true, brand_img:true},
    { goods_no: '643145142', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145169', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145244', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145988', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145918', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145919', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145920', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145921', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145922', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145923', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145924', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145925', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145926', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145927', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145928', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145929', more_img: true, soho_img: true, brand_img: true },
{ goods_no: '643145930', more_img: true, soho_img: true, brand_img: true }, ]


function bail(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}


function on_connect(err, conn) {
  if (err !== null) return bail(err);

  var q = 'task_queue';
  
  conn.createChannel(function(err, ch) {
    if (err !== null) return bail(err, conn);
    ch.assertQueue(q, {durable: true}, function(err, _ok) {
        if (err !== null) return bail(err, conn);
        var msg = JSON.stringify(obj[i]);
      var msg2 = process.argv.slice(2).join(' ') || "Hello World!"+i;
      ch.sendToQueue(q, new Buffer(msg), {persistent: true});
      console.log(" [x] Sent '%s'", msg);
      ch.close(function() { conn.close(); });
    });
  });
  setTimeout(func, 1000);
}
function func() {
    i++;
    amqp.connect(on_connect);
}


amqp.connect(on_connect);
