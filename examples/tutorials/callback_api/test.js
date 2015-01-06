var fs = require('extfs');
var http = require('http');

var basePath = 'goodsdaq_image/goods_image2/';
var path;
var nas=['/gdimg1_ifs/gdimg1/','/gdimg3_ifs/gdimg3/','/gdimg4_ifs/gdimg4/','/gdimg5_ifs/gdimg5/'];
var basicFolder = ['middle_img','middle_img2','middle_img3','middle_jpgimg','middle_jpgimg2','middle_jpgimg3','gallery_img','gallery_jpgimg','large_img','large_jpgimg','exlarge_img','qrcode_img','shop_img','small_img','small_img2','small_jpgimg'];
var goodNo = ['643145121','643145142','643145169','643145244','643145988','643145918','643145919','643145920','643145921','643145922','643145923','643145924','643145925','643145926','643145927','643145928','643145929','643145930'];
var upPath;
for (var i = 0; i < goodNo.length; i++) {
    console.log('Goods No : ' + goodNo[i]);
    for (var j = 0; j < basicFolder.length; j++) {
        console.log(basicFolder[j]);
        path = getPath(i, j);
        if (fs.existsSync(path)) {
            fs.unlink(path, function (err) {
                if (err) throw err;
                console.log("deleted img!");
                upPath = getUpperPath(path);
                if (fs.isEmptySync(upPath)) {
                    fs.rmdir(upPath, function (err) {
                        if (err) throw err;
                        console.log('deleted folder!' + upPath);
                    });
                }
            });
            
            console.log(true);
        }
        else {
            console.log(false);
        }
        //console.log(path);
        
    }
}
function getPath(i,j){
    return nas[0] + basePath + basicFolder[j] + '/' + goodNo[i].substring(0, 3) + '/' + goodNo[i].substring(3, 6) + '/' + goodNo[i] + '.jpg';
}

function getUpperPath(path) {
    var index = path.substring(0,path.length-1).lastIndexOf('/');
    return path.substring(0, index);
}


/*
fs.exists('http://gdimg1.gmarket.co.kr/goods_image2/middle_jpgimg3/643/145/643145920.jpg', function (ex) {
    console.log(ex);
});
*/