var nodemailer = require('nodemailer');


// NB! No need to recreate the transporter object. You can use
// the same transporter object for all e-mails

// setup e-mail data with unicode symbols


// send mail with defined transport object

let index = 1;
let fromMail=["d","e","f","g","h"];
module.exports.sendEMail = function(subject, text){
    let from = fromMail[fromMail.length % index]+'@ultbtc.com';
    index++;
    console.log(from);
    var transporter = nodemailer.createTransport({
        //https://github.com/andris9/nodemailer-wellknown#supported-services 支持列表
        host: 'smtp.exmail.qq.com',
        port: 465, // SMTP 端口
        secureConnection: true, // 使用 SSL
        auth: {
            user: from,
            //这里密码不是qq密码，是你设置的smtp密码
            pass: 'Ww18767104183'
        }
    });

    var mailOptions = {
        from: from, // 发件地址
        to: 'a@ultbtc.com', // 收件列表
        subject: subject, // 标题
        //text和html两者只支持一种
        text: text, // 标题
        html: `<b>${text}</b>` // html 内容
    };


    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);

    });

}