/*!
 * wk - controllers/wk.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */
var excel = require("../lib/excel.js");
var nodemailer = require("nodemailer");
var config = require('../config');
var db = require('../db');
var dbm = require('../dbm');
var crypto = require('crypto');
var url = require('url');

exports.app = function (req, res, next) {
	console.log("app");
	res.redirect('/public/b/www/index.html');
};

exports.data = function (req, res, next) {
	console.log("todo");
	db.q("select * from WK.S_TODO",[],function(datas){
		res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
		res.write(JSON.stringify(datas));
		res.end();
	});
};

exports.list = function (req, res, next) {

	var sql = "select * from REN."+req.body.model.toUpperCase();

	db.q(sql,[],function(datas){
		console.log(datas);
		res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"});
		res.write(JSON.stringify(datas));
		res.end();
	});
};

exports.mail  = function(obj)
{
	var transport = nodemailer.createTransport('smtps://'+config.mail.user+':'+config.mail.pass+'@'+config.mail.host);
	transport.sendMail({
			from : obj.from,
			to : obj.to,
			subject: obj.subject,
			generateTextFromHTML : true,
			html : obj.html
		},
		function(error, response){
			if(error){
				console.log(error);
			}else{//发送成功
				//console.log("Message sent: " + response.message);
				if(obj.func)
				{
					obj.func();
				}
			}
			transport.close();
		});
};


exports.view = function (req, res, next) {
  res.redirect('/');
};

function rtnInfo(res,info)
{
	res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
	res.write(info);
	res.end();
}

exports.config = function (req, res, next) {
	var me = this;
	var data = req.body;
	var option = data.option;
	console.log(data);
	var func = function(rtn)
	{
		console.log(rtn);
		if(rtn.affectedRows == 1)
		{
			res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
			if(parseInt(rtn.insertId)>0)
			{
				res.write("{success:true,id:"+rtn.insertId+",option:'a'}");
			}
			else
			{
				res.write("{success:true,option:'u'}");
			}		
			res.end();
		}
	};
	if(option == "q")//查询
	{
		var sql  = "SELECT t.spot,t.id wktime,u.id user,s.starttime as cstarttime,s.endtime as cendtime,t.r0,t.r1,t.r2,t.r3,t.r4,t.r5,t.r6,t.mintime,t.maxtime,s.stime1,s.etime1,s.stime2,s.etime2,s.stime3,s.etime3,s.stime4,s.etime4,s.stime5,s.etime5 ";
		sql +=" FROM WK.T_WKTIME t left join WK.T_USER u on t.user = u.id left join WK.T_SPOT s on t.spot = s.id where u.id = ?";
		var id = data.user;
		var month =data.month;
		var params = [id];
		console.log(sql);
		db.q(sql,params,function(rows)
		{
			if(rows.length>0)
			{
				console.log(JSON.stringify(rows[0]));
				res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
				var tmp =  JSON.parse(JSON.stringify(rows[0]));
				tmp.success = true;
				res.write(JSON.stringify(tmp));
				res.end();
			}
			else
			{
				res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
				res.write("{success:false}");
				res.end();
			}
		});
	}
	else
	{
		var _table = option.substring(0,2);//表
		var _do = option.substring(2,3);//操作模式
		console.log([_table,_do]);
		if(_table == "wk")
		{
			data.table = "`WK`.T_WKTIME";
		}
		else
		{
			data.table = "`WK`.`T_SPOT`";
		}
		if(_do == "i")
		{
			db.i(data,func);
		}
		else
		{
			db.u(data,func);
		}
	}
};



exports.pwd = function (req, res, next) {
    var me = this;
	var data = req.body;
	var option = data.option;
	if(option == "c")//修改密码
	{
		var sql = "SELECT ID,EMAIL email FROM WK.T_USER WHERE ID =? and PASSWORD = ?"
		var pwd = crypt(data.password);
		var newPwd = crypt(data.newpassword);
		var id =req.session.user;
		console.log(sql);
		console.log(id);
		console.log(pwd);//原有密码
		console.log(newPwd);//原有密码
		var params = [id,pwd];
		db.q(sql,params,function(rows)
			{	
				var rtn = "{success:false}"
				if(rows.length>0)//有数据
				{
					var email = rows[0].email;
					var data = {};
					data.table = "`WK`.`T_USER`";
					data.id = id;
					data.password = newPwd;
					console.log(data.password)
					db.u(data,function(rtndata){
						if(rtndata.affectedRows == 1)
						{
									console.log("success")
									rtn = "{success:true}"
									console.log(rtn)
									var obj = {};
									obj.subject = "修改密码";
									obj.html = "密码已修改";
									obj.from = "天時勤務";
									obj.to = email;
									exports.mail(obj);

									res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
									res.write(rtn);
									res.end();
						}
					});
				}
				else
				{
					rtn = "{success:false,info:'pwd'}"
					console.log(rtn)
					res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
					res.write(rtn);
					res.end();
				}
			});
	}
	else//重置密码
	{

		var sql = "SELECT u.ID id,email,no FROM WK.T_USER u inner join WK.T_EMPLOYEE e on u.employee = e.id WHERE e.NO =? and EMAIL = ?"
		console.log(sql)
		console.log(data.name)
		console.log(data.email)
		var params = [data.name,data.email];
		db.q(sql,params,function(rows)
		{
			if(rows.length>0)
			{
				//重置密码
				var qdata = JSON.parse(JSON.stringify(rows))[0];
				var pwd= qdata.no+"123";//重置密码
				var id= qdata.id;//UserId
					var data = {};
					data.table = "`WK`.`T_USER`";
					data.id =  qdata.id;
					data.password = crypt(pwd);
					console.log(data.password)
					db.u(data,function(rtndata){
						if(rtndata.affectedRows == 1)//更新成功
						{
									var obj = {};
									obj.subject = "重置密码";
									obj.html = "密码已重置为"+pwd+"";
									obj.from = "天時勤務";
									obj.to = qdata.email;
									obj.func = rtnInfo(res,"{success:true}");
									exports.mail(obj);
						}
					});
			}
			else
			{
				rtnInfo(res,"{success:false,info:'no'}");//不存在
			}
		});

	}
}

exports.login = function (req, res, next) {
	var me = this;
	var data = req.body;
	var name = data.name;
	var pwd = crypt(data.password);
	var sql = "SELECT u.ID,ROLE,email,e.name FROM WK.T_USER u inner join WK.T_EMPLOYEE e on u.employee = e.id WHERE e.NO =? and PASSWORD = ? and failedcount < ?"
    console.log(sql);
	console.log(name);
	console.log(pwd);
	var params = [name,pwd,10];
	db.q(sql,params,function(rows)
		{	
			var rtn = "{success:false}"
			if(rows.length>0)
			{
				// RowDataPacket { ID: 2, ROLE: null }
				console.log(rows);
				var data = JSON.parse(JSON.stringify(rows));
				rtn = "{success:true,user:"+data[0].ID+",role:"+data[0].ROLE+"}"
				req.session.user = data[0].ID;
				req.session.role = data[0].ROLE;
			}
			res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
			res.write(rtn);
			res.end();
		});
};


function crypt(info)
{
	var content = info;
	var shasum = crypto.createHash('sha1');
	shasum.update(content);
	return shasum.digest('hex');
}