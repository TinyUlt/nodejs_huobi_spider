const moment = require('moment');
const http = require('../framework/httpClient');
const Promise = require('bluebird');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://root:TinyUlt920805@47.52.225.13:27017/huobi?authSource=admin';
var dbase;
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log('Connected correctly to server.');
    dbase = db.db("huobi");
    // dbase.createCollection('site', function (err, res) {
    //     assert.equal(null, err);
    //     console.log("创建集合!");
    //     db.close();
    // });
});

const BASE_URL = 'https://api.huobi.pro';

function getDateString(){
    var today=new Date();
    return today.getFullYear()+"_" + (today.getMonth() + 1) + "_" + today.getDate();
}
function getDataValue(){
    var today=new Date();
    return today.valueOf();
}
let timeRecord={};
let preValue={};
// timeRecord["btc"] = {
//     halfMinute:0,
//     minute:0,
//     fiveMinute:0,
//     tenMinute:0,
//     halfHour:0,
//     hour:0
// };
// timeRecord["usd"] = {
//     halfMinute:0,
//     minute:0,
//     fiveMinute:0,
//     tenMinute:0,
//     halfHour:0,
//     hour:0
// };
// timeRecord["usdt"] = {
//     halfMinute:0,
//     minute:0,
//     fiveMinute:0,
//     tenMinute:0,
//     halfHour:0,
//     hour:0
// };

function insertOne(coin, price){

    if(timeRecord[coin] == null){

        timeRecord[coin] = {
            second:0,
            halfMinute:0,
            minute:0,
            fiveMinute:0,
            tenMinute:0,
            halfHour:0,
            hour:0
        };

    }
    if(preValue[coin] == null){
        preValue[coin] = 0;
    }
    //过滤重复的数据
    if(preValue[coin] == price){
        console.log(coin + " 数据相同， 跳过")
        return;
    }
    preValue[coin] = price;
    let nowTime =  getDataValue();
    var where = {_id:nowTime};

    let setData = {};

    if(nowTime - timeRecord[coin].second >= 1000 ){
        timeRecord[coin].second = nowTime;
        setData.second = 1;
    }
    if(nowTime - timeRecord[coin].halfMinute >= 1000*30 ){
        timeRecord[coin].halfMinute = nowTime;
        setData.halfMinute = 1;
    }
    if(nowTime - timeRecord[coin].minute >= 1000*60 ){
        timeRecord[coin].minute = nowTime;
        setData.minute = 1;
    }
    if(nowTime - timeRecord[coin].fiveMinute >= 1000*60*5 ){
        timeRecord[coin].fiveMinute = nowTime;
        setData.fiveMinute = 1;
    }
    if(nowTime - timeRecord[coin].tenMinute >= 1000*60*10 ){
        timeRecord[coin].tenMinute = nowTime;
        setData.tenMinute = 1;
    }
    if(nowTime - timeRecord[coin].halfHour >= 1000*60*30 ){
        timeRecord[coin].halfHour = nowTime;
        setData.halfHour = 1;
    }
    if(nowTime - timeRecord[coin].hour >= 1000*60*60 ){
        timeRecord[coin].hour = nowTime;
        setData.hour = 1;
    }

    setData[coin] = price;
    var updateStr = {$set: setData};
    dbase.collection("g").update(where,updateStr,{upsert:true}, function(err, res) {
        if (err) throw err;
        console.log(coin+"文档插入成功");
    });


}

function handle(coin, price) {
    insertOne(coin, price);

    // let symbol = (coin + currency).toLowerCase();
    // orderbook[symbol] = price;
    //  console.log(orderbook[symbol]);
    // TODO 根据数据生成你想要的K线 or whatever...
    // TODO 记录数据到你的数据库或者Redis
}

function get_depth() {
    let coin = "btc";
    let currency = "usdt";
    return new Promise(resolve => {
        let url = `${BASE_URL}/market/detail/merged?symbol=${coin}${currency}`;
        console.log(url);
        http.get(url, {
            timeout: 10000,
            gzip: true
        }).then(data => {
            // console.log(data);
            let json = JSON.parse(data);
            let price = json.tick.close;

            handle(coin, price);
            handle("btcamount", json.tick.amount);
            resolve(null);
        }).catch(ex => {
            console.log(coin, currency, ex);
            resolve(null);
        });
    }, reject => {
        console.log("reject");
        resolve(null);
    });
}
function get_usd(){
    return new Promise(resolve => {
        // let url = "https://api-otc.huobi.pro/v1/otc/base/market/price";
        let url = "http://hq.sinajs.cn/rn=list=fx_susdcny";
        console.log(url);
        http.get(url, {
            timeout: 10000,
            gzip: true
        }).then(data => {


            // let json = JSON.parse(data);
            // let price = null;
            // for(let i = 0; i < json.length; i++){
            //     if(json[i].coinId == 2){
            //         price =json[i].price
            //     }
            // }
            let list = data.split(",");
            console.log(list[1]);
            handle("usd" , parseFloat(list[1]));
            resolve(null);
        }).catch(ex => {
            console.log("catch");
            resolve(null);
        });
    }, reject => {
        console.log("reject");
        resolve(null);
    });
}
let usdtsell2sum=0;

let usdtbuy2sum=0;

function get_usdtsell(){
    return new Promise(resolve => {
        let url = "https://api-otc.huobi.pro/v1/otc/trade/list/public?coinId=2&tradeType=1&currPage=1&online=1&range=0&currentPage=1&merchant=0";
        console.log(url);
        http.get(url, {
            timeout: 10000,
            gzip: true
        }).then(data => {

            let json = JSON.parse(data).data;
            let price = 0.0;
            for(let i = 0; i < json.length; i++){
                price += json[i].price
            }
            price = price / json.length;
            if(usdtsell2sum!=0){
                price = (price + usdtsell2sum )/2.0;
            }

            handle("usdt" , parseFloat(price));
            resolve(null);
        }).catch(ex => {
            console.log("catch");
            resolve(null);
        });
    }, reject => {
        console.log("reject");
        resolve(null);
    });
}
function get_usdtsell2(){
    return new Promise(resolve => {
        let url = "https://api-otc.huobi.pro/v1/otc/trade/list/public?coinId=2&tradeType=1&currPage=2&online=1&range=0&currentPage=1&merchant=0";
        console.log(url);
        http.get(url, {
            timeout: 10000,
            gzip: true
        }).then(data => {

            let json = JSON.parse(data).data;
            let price = 0.0;
            for(let i = 0; i < json.length; i++){
                price += json[i].price
            }
            usdtsell2sum = price / json.length;
            resolve(null);
        }).catch(ex => {
            console.log("catch");
            resolve(null);
        });
    }, reject => {
        console.log("reject");
        resolve(null);
    });
}

function get_usdtbuy(){
    return new Promise(resolve => {
        let url = "https://api-otc.huobi.pro/v1/otc/trade/list/public?coinId=2&tradeType=0&currPage=1&online=1&range=0&currentPage=1&merchant=0";
        console.log(url);
        http.get(url, {
            timeout: 10000,
            gzip: true
        }).then(data => {

            let json = JSON.parse(data).data;
            let price = 0.0;
            for(let i = 0; i < json.length; i++){
                price += json[i].price
            }
            price = price / json.length;
            if(usdtbuy2sum!=0){
                price = (price + usdtbuy2sum)/2.0;
            }

            handle("usdtbuy" , parseFloat(price));
            resolve(null);
        }).catch(ex => {
            console.log("catch");
            resolve(null);
        });
    }, reject => {
        console.log("reject");
        resolve(null);
    });
}
function get_usdtbuy2(){
    return new Promise(resolve => {
        let url = "https://api-otc.huobi.pro/v1/otc/trade/list/public?coinId=2&tradeType=0&currPage=2&online=1&range=0&currentPage=1&merchant=0";
        console.log(url);
        http.get(url, {
            timeout: 10000,
            gzip: true
        }).then(data => {

            let json = JSON.parse(data).data;
            let price = 0.0;
            for(let i = 0; i < json.length; i++){
                price += json[i].price
            }
            usdtbuy2sum = price / json.length;
            resolve(null);
        }).catch(ex => {
            console.log("catch");
            resolve(null);
        });
    }, reject => {
        console.log("reject");
        resolve(null);
    });
}

function run() {
    // var today = getDateString();
   // get_marketUsdtPrice();
    //setTimeout(run, 2000);
    // console.log(`run ${moment()}`);
    // let list_btc = ['ltc-btc', 'eth-btc', 'etc-btc', 'bcc-btc', 'dash-btc', 'omg-btc', 'eos-btc', 'xrp-btc', 'zec-btc', 'qtum-btc'];
    // let list_usdt = ['btc-usdt', 'ltc-usdt', 'eth-usdt', 'etc-usdt', 'bcc-usdt', 'dash-usdt', 'xrp-usdt', 'eos-usdt', 'omg-usdt', 'zec-usdt', 'qtum-usdt'];
    // let list_eth = ['omg-eth', 'eos-eth', 'qtum-eth'];
    // let list = list_btc.concat(list_usdt).concat(list_eth);




    // let list = [get_usd];
    let list = [get_depth,get_usd,get_usdtsell2,get_usdtsell,get_usdtbuy2, get_usdtbuy];
    Promise.map(list, item => {

        return item();
    }).then(() => {

         setTimeout(run, 1000 * 3);
    });
}

run();