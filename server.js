/*!
 * wk - app.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

require('./lib/patch');
var express = require('express');
var render = require('connect-render');
var urlrouter = require('urlrouter');
var config = require('./config');
var wk = require('./controllers/wk');
var session = require('express-session'); //如果要使用session，需要单独包含这个模块
var cookieParser = require('cookie-parser'); //如果要使用cookie，需要显式包含这个模块
var bodyParser = require("body-parser");
var csurf = require("csurf");
var serveStatic = require('serve-static');

var app = express();
//静态文件 存放HTML JS等等
app.use('/public',serveStatic(__dirname + '/public', {maxAge: 3600000 * 24 * 30}));
app.use(cookieParser());
app.use(express.query());
app.use(bodyParser.urlencoded({
  extended: true
}));
  //bodyParser用于解析客户端请求的body中的内容,内部使用JSON编码处理,url编码处理以及对于文件的上传处理.
 //将post参数解析成JSON化的req.body
app.use(bodyParser.json());
app.use(session({
		resave:false,//添加这行  
		saveUninitialized: true,//添加这行   
		secret: config.session_secret,  
		cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}//30 days  
	}));

app.use(function(req,res,next){
    if (!req.session.user) {
		var s = req.url.substring(0,6);
        if((s == "/login")||(s == "/excel")||(s == "/rspwd")||(req.url=="")||(req.url=="/")){//以login作为开始
			console.log('Go Login');
            next();//如果请求的地址是登录则通过，进行下一个请求
        }
        else
        {
			console.log('No Login');
            res.redirect('/login');
        }
    } else if (req.session.user) {
        next();
    }
});


//身份认证
//app.use(csurf());
app.use(render({
  root: __dirname + '/views',
  layout: false,
  cache: config.debug, // `false` for debug
  helpers: {
    config: config,
    _csrf: function (req, res) {
      return req.session._csrf;
    }
  }
}));

/**
 * 页面转向
 */
var router = urlrouter(function (app) {
  app.get('/', wk.app);
  app.get('/wk/list', wk.list);//传递时地址转向
  app.post('/wk/list', wk.list);
  app.get('/wk/do', wk.data);
  app.post('/wk/do', wk.data);
  app.post('/login', wk.login);
  app.post('/pwd', wk.pwd)//修改密码,相关
  app.get('/excel/:month', wk.excel)//出力Excel(:month REST方式前后台对应)
  app.post('/rspwd', wk.pwd)//重置密码,相关
  app.post('/config', wk.config)//设置
   app.post('/wk/email', wk.email)//合计时间
  app.post('/atime', wk.atime)//合计时间
  app.post('/wk/alist', wk.alist)//合计列表
  app.get('/wk/:id', wk.view);
  app.get('/wk/:id/delete', wk.delete);
});
app.use(router);

app.listen(config.port);
console.log('Server start on ' + config.port);


app.get('/login',function(req,res){
    res.render("login");
});
/*
app.post('/login',function(req,res){
    if(req.body.username=="love" && req.body.password=="love"){
        var user = {'username':'love'};
        req.session.user = user;
        res.redirect('/admin/app/list');
    }
    else
    {
        res.redirect('/login');
    }
});

app.get('/logout',function(req,res){
    req.session.user = null;
    res.redirect('/login');
});
*/