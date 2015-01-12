/**
 * Created by chabae on 2015-01-12.
 */
var fs = require('extfs'),
    amqp = require('amqp'),
    config = require('config'),
    removemq = config.mq.remove,
    http = require('http'),
//https = require('https'),
    logger = require('./logger'),
    basicDir = config.dir_path.basic,
    moreDir = config.dir_path.more,
    sohoDir = config.dir_path.soho,
    brandDir = config.dir_path.brand,
    cluster = require('cluster'),
    q_name = removemq.queue,
    brandDirCnt = config.brandDirCnt,
    parseString = require('xml2js').parseString;


    var removeConn = amqp.createConnection({
        host:removemq.host,
        port:removemq.port,
        login:removemq.login,
        password:removemq.password,
        vhost:removemq.vhost
    });

    removeConn.on('ready',function(){
        logger.info(process.pid+'connected!');
        var rq = removeConn.queue(q_name,{autoDelete:false,durable:true},function(q){
            logger.info('Queue '+q.name+' is opened.');
            rq.subscribe({ack:true,prefetchCount:5}, function(message,headers,deliveryInfo,m) {
                //logger.info('message received.' + message.data.toString('utf-8'));
                getQueueData(message.data,function(err,goodNo,moreImg,sohoImg,brandImg){
                    if(err){
                        logger.error(err);
                        m.reject(false);
                    }
                    else {
                        logger.info('Goods No : ' + goodNo);
                        removeImgs(goodNo, moreImg, sohoImg, brandImg, function (err) {
                            if (err) {
                                logger.error(err);
                                m.reject(false);
                            }
                            else {
                                getCurrentDate(function (date) {
                                    notifyTSPAPI(goodNo, date, function (err) {
                                        if (err) {
                                            logger.error(err);
                                            m.reject(false);
                                        }
                                        else {
                                            m.acknowledge();
                                        }
                                    })
                                });
                            }
                        });
                    }
                });
                //m.acknowledge();
                //ackk(m,message);
                //setTimeout(func(m),1000);
            });
        });
    });
    function getQueueData(msgData,callback){
        try {
            var obj = JSON.parse(msgData);
            if (!obj.more_img && !obj.soho_img && !obj.brand_img) {
                callback(null,obj.gd_no, true, true, true);
            }
            else {
                callback(null,obj.gd_no, obj.more_img, obj.soho_img, obj.brand_img);
            }
        }
        catch(err){
            callback(err);
        }
    }

    function removeImgs(goodNo,moreImg,sohoImg,brandImg,callback) {
        //sync(function () {});
        removeBasicImg(goodNo, function (err) {
            if (err) callback(err);
        });
        if (moreImg) {
            removeMoreImgDir(goodNo, function (err) {
                if (err) callback(err);
            });
        }
        if (sohoImg) {
            removeSohoImg(goodNo, function (err) {
                if (err) callback(err);
            });
        }
        if (brandImg) {
            removeBrandImg(goodNo, function (err) {
                if (err) callback(err);
            });
        }
        callback();
    }

    function getCurrentDate(callback){
        var currentdate = new Date();
        var datetime =
            currentdate.getFullYear() + "-"
            + (currentdate.getMonth()+1) + "-"
            + currentdate.getDate() + " "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();
        callback(datetime);
    }

    function getPathOption(goodNo,callback){
        try {
            var cfg_option = config.remove.dest_path_option;
            for (var i = 0; i < cfg_option.length; i++) {
                if (cfg_option[i].gd_no >= goodNo) {
                    callback(null, cfg_option[i]);
                }
            }
            callback(null,cfg_option[cfg_option.length]);
        }
        catch(err)
        {
            callback(err);
        }
    }


    function removeBasicImg(goodNo,callback) {
        for (var i = 0; i < basicDir.length; i++) {
            getBasicPath(goodNo, basicDir[i], function (err, path) {
                if(fs.existsSync(path)){
                    //logger.info(basicDir[i]+' : true');
                    fs.unlink(path, function (err) {
                        if (err) callback(err);
                        logger.info("deleted img!");
                        callback();
                    });
                }
                else{
                    //logger.info(basicDir[i]+' : false');
                    callback();
                }
            });
        }
    }

    function removeSohoImg(goodNo,callback){
        for(var i = 0;i<sohoDir.length;i++){
            getBasicPath(goodNo,sohoDir[i],function(err,path){
                if(fs.existsSync(path)){
                    //logger.info(sohoDir[i]+' : true');
                    fs.unlink(path, function (err) {
                        if (err) callback(err);
                        logger.info("deleted soho img!");
                        callback();
                    });
                }
                else{
                    //logger.info(sohoDir[i]+' : false');
                    callback();
                }
            });
        }
    }

    function removeBrandImg(goodNo,callback){
        for(var i = 0;i<brandDir.length;i++){
            for(var j = 0; j<brandDirCnt; j++){
                getBasicPath(goodNo,'brand_img/'+twoDigit(j+1)+'/'+brandDir[i],function(err,path){
                    if(fs.existsSync(path)){
                        //logger.info('brand '+twoDigit(j+1)+'/'+brandDir[i]+' : true');
                        fs.unlink(path,function(err){
                            if(err) callback(err);
                            logger.info("deleted brand img!");
                        });
                    }
                    else{
                        //logger.info('brand '+twoDigit(j+1)+'/'+brandDir[i]+' : false');
                        callback();
                    }
                });
            }
        }
    }

    function removeMoreImgDir(goodNo,callback){
        for(var i = 0;i<moreDir.length;i++){
            getMoreImgPath(goodNo,moreDir[i],function(err,path){
                if(fs.existsSync(path)){
                    //logger.info(moreDir[i]+' : true');
                    try {
                        deleteFolderRecursiveSync(path);
                        callback();
                    }
                    catch(err)
                    {
                        callback(err);
                    }
                }
                else{
                    //logger.info(moreDir[i]+' : false');
                    callback();
                }
            });
        }
    }

    function deleteFolderRecursiveSync(path) {
        var files = [];
        if( fs.existsSync(path) ) {
            files = fs.readdirSync(path);
            files.forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursiveSync(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                    logger.info("deleted more img!");
                }
            });
            fs.rmdirSync(path);
            logger.info("deleted more dir!");
        }
    }

    function getMoreImgPath(goodNo, dir, callback){
        getPathOption(goodNo,function(err,pathOption){
            if(err){
                callback(err);
            }
            else if(pathOption.dir_type=="1"){
                callback(null, pathOption.base_path + '/' + dir + '/' + goodNo.substring(7,9) + '/' + goodNo);
            }
            else{
                callback(null, pathOption.base_path + '/' + dir + '/' + goodNo.substring(0, 3) + '/' + goodNo.substring(3, 6) + '/' + goodNo);
            }
        });
    }

    function getBasicPath(goodNo, dir, callback) {
        getPathOption(goodNo,function(err,pathOption) {
            if(err){
                callback(err);
            }
            else if (pathOption.dir_type == "1") {
                callback(null, pathOption.base_path + '/' + dir + '/' + goodNo.substring(7, 9) + '/' + goodNo + '.jpg');
            }
            else {
                callback(null, pathOption.base_path + '/' + dir + '/' + goodNo.substring(0, 3) + '/' + goodNo.substring(3, 6) + '/' + goodNo + '.jpg');
            }
        });
    }

    function twoDigit(number) {
        return number >= 10 ? number : "0"+number.toString();
    }

    function notifyTSPAPI(goodNo, delDate, callback){
        sendRequest(goodNo,delDate,function(err){
            if(err) {
                callback(err);
            }
            callback();
        });
    }

    function findResult(str,callback){
        var index = str.indexOf("<"+config.method_name+"Result>");
        var result = str.substring(index,str.length);
        index = result.indexOf("</"+config.method_name+"Response>");
        result = result.substring(0,index);
        parseString(result,function(err,data){
            if(err){
                callback(false);
            }
            else if(data.AddGimgDelLogResult=='true'){
                callback(true);
            }
            else{
                callback(false);
            }
        });
    }

    function sendRequest(goodsNo, delDate, callback) {
        var status = 0;
        var postdata = '<?xml version="1.0" encoding="utf-8"?>'
            + '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
            + '<soap:Body>'
            + '<'+config.method_name+' xmlns="http://www.ebaykorea.com/Tsp/Selling">'
            + '<gdNo>' + goodsNo + '</gdNo>'
            + '<del_date>' + delDate + '</del_date>'
            + '</'+config.method_name+'>'
            + '</soap:Body>'
            + '</soap:Envelope>';

        var options = {
            hostname: config.api.hostname,
            port: config.api.port,
            path: config.api.path,
            method: "POST",
            headers: {
                "Content-Type": "text/xml",
                "Content-Length": postdata.length // Often this part is optional
            }
        };

        var request = http.request(options, function(response) {
            response.on('data', function (chunk) {
                findResult(chunk.toString(),function(isTrue){
                    if(isTrue){
                        status=1;
                    }
                    else{
                        status=0;
                    }
                });
            });

            response.on('end',function() {
                if(status==1) {
                    //logger.info(result);
                    logger.info('gd_no: ' + goodsNo + ' || Log insert end successfully.');
                } else {
                    logger.info('gd_no: ' + goodsNo + ' || Log insert Failed.');
                }
                callback();
            });
        });

        request.on('error', function(e) {
            logger.error('problem with API request: ' + e.message);
            callback(e);
        });

        request.write(postdata);

        request.end();
    }
