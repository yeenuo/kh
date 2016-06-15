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
var crypto = require('crypto');
var url = require('url');

exports.app = function (req, res, next) {
	console.log("app");
	res.redirect('/public/index.html');
};
 
exports.new = function (req, res, next) {
  var title = req.body.title || '';
  title = title.trim();
  if (!title) {
    return res.render('error.html', {message: '标题是必须的'});//render jsp 生成模板
  }
  db.wk.save({title: title, post_date: new Date()}, function (err, row) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};


exports.excel = function(req, res, next)
{
	if(req.session.role==1)
	{
		exports.exportExcel(req,res);
	}
};
exports.alist = function(req,res)
{	
	if(req.session.role==1)
	{
		var sql = "SELECT e.no,e.name,e.id as eid,a.*,wk.mintime,wk.maxtime FROM WK.T_ALLWORK a inner join WK.T_WKTIME wk on a.user = wk.user" 
		sql  = sql  +" left join WK.T_USER user on a.user = user.id left join WK.T_EMPLOYEE e on user.employee = e.id  where a.month = ? order by user";
		var month = req.body.month;
		db.q(sql,[month],function(rows)
		{	
			res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
			res.write(JSON.stringify(rows));
			res.end();
		});
		}
};
exports.email = function(req,res)
{	
	if(req.session.role==1)
	{
		 var tomail = req.body.tomail || '###';
		var sql = "SELECT e.email from WK.T_EMPLOYEE e where e.id in ("+tomail+")";
		
		db.q(sql,[],function(rows)
		{	
			if(rows.length>0)
			{
			res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
			res.write("{success:true}");
			res.end();
			}

			for (var i=0;i< rows.length;i++ )
			{
				var obj = rows[i].email;
				var obj = {};
				obj.subject = "作業時間不足";
				obj.html = "<font color='red'>作業時間不足、注意してください。</font>";
				obj.from = "天時勤務";
				obj.to = rows[i].email;
				exports.mail(obj);
			}
			
		});
		}
};
exports.exportExcel=function(req,res){
	var month =req.params.month;
	var conf ={};
	conf.stylesXmlFile = "lib/styles.xml";
		conf.cols = [
			{caption:'番号', type:'string'},
			{caption:'名前', type:'string'},
			{caption:'最低時間', type:'number'},
			{caption:'最高時間', type:'number'},
			{caption:'実際時間', type:'number'},
			{caption:'見込み時間', type:'number'},
			{caption:'状態', type:'string', 
			beforeCellWrite:function(){
    
            return function(row, cellData, eOpt){
                if (cellData == "超える"){
                    eOpt.styleIndex = 1;
                }  
                else if(cellData == "不足"){
                    eOpt.styleIndex = 2;
                }
				else
				{
					eOpt.styleIndex = 0;
				}
				console.log(eOpt.styleIndex);
                return cellData;
            } 
        }()
			}
		];
		
		var sql = "SELECT e.no,e.name,a.*,wk.mintime,wk.maxtime FROM WK.T_ALLWORK a inner join WK.T_WKTIME wk on a.user = wk.user" 
		sql  = sql  +" left join WK.T_USER user on a.user = user.id left join WK.T_EMPLOYEE e on user.employee = e.id  where a.month = ? order by user";
		db.q(sql,[month],function(rows)
			{
				var datas = [];
				console.log(rows);
				for(var i=0;i<rows.length;i++)
				{
					var obj = rows[i];
					var data = [];
					data.push(obj.no);
					data.push(obj.name);
					data.push(obj.mintime);
					data.push(obj.maxtime);
					data.push(obj.actualtime);
					data.push(obj.alltime);
					if(obj.alltime>obj.maxtime)
					{
						data.push("超える");
					}
					else if(obj.alltime<obj.mintime)
					{
						data.push("不足")
					}
						else
					{
							data.push("正常")
					}

					datas.push(data);
				}
				conf.rows = datas;
				var filename ="excel.xlsx";
				res.setHeader('Content-Disposition', 'attachment; filename='+encodeURIComponent(filename));
				excel.createExcel({
					data:conf,
					savePath:"public/file/excel",
					filename:filename,
					cb:function(path){
						excel.download(path,req, res,true);
					}
				});
		 
			});



	}


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


exports.atime = function(req, res, next)
{
	var me = this;
	var data = req.body;
	var sql = "SELECT ID as id FROM WK.T_ALLWORK WHERE USER =? and MONTH = ?"
	var params =  [req.session.user,data.month];
	data.table = "WK.T_ALLWORK";
	db.q(sql,params,function(rows)
	{	
		if(rows.length>0)//有数据,更新
		{
			data.id =  JSON.parse(JSON.stringify(rows[0])).id;
			db.u(data);
		}
		else
		{
			db.i(data);
		}
	});

}



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

exports.data = function (req, res, next) {
    var me = this;
	var data = req.body;
	var id = parseInt(data.id);
	console.log(id);
	data.table = "`WK`.`T_WORK`";
	var func = function(rtn)
	{
		console.log(rtn);
		if(rtn.affectedRows == 1)
		{
			console.log("success");//post方式用此获得数据
			res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
			if(!isNaN(parseInt(rtn.insertId)))
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
	if(data.option == "d")//删除
	{
		db.d(data,func);
	}
	else if(isNaN(id))
	{
		data.id = null;
		console.log("add:");//post方式用此获得数据
		console.log(data);//post方式用此获得数据
		db.i(data,func);
	}
	else
	{
		console.log("update:");//post方式用此获得数据
		console.log(data);//post方式用此获得数据
		db.u(data,func);
	}	
};

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

exports.list = function (req, res, next) {
	var me = this;
	var data = req.body;
	var month = data.month;
	var user = req.session.user;
	//month = "201606";
	//user = "1";
	//SELECT *  FROM WK.T_WORK WHERE SUBSTRING(date,1,6) = '201606' and EMPLOYEE = '1' 
	var sql = "SELECT * FROM WK.T_WORK WHERE SUBSTRING(date,1,6) =? and USER = ? ORDER BY date;"
	var params = [month,user];

    console.log(sql);
	console.log(params);
	db.q(sql,params,function(rows)
		{	
			var data = JSON.parse(JSON.stringify(rows));
			res.writeHead(200, {"Content-Type": "text/html;charset:utf-8"}); 
			res.write(JSON.stringify(exports.adata(month,data)));
			res.end();
		});
};

exports.adata =  function(month,datas)
{
	var cdata = [];
	var y =  Number(month.substring(0,4));//年份
	
	var m =  Number(month.substring(4,6));//月份
	var nm =  (m+1)%12;//下一个月
    var temp = new Date(y+"/"+nm+"/01");
	temp.setHours(temp.getHours() - 3);//推后三小时
    var days =  temp.getDate();//获取下月1号多少天
	
	for(var i=1;i<=days;i++)
	{

		var _day = i + "";
		if(i<10)
		{
			_day = "0" + _day;
		}
		var _d = month+_day;//获取日期
		//作成数据
		var obj = {"date":_d,"starttime":"0000","endtime":"0000","worktime":0,"reason":0,"rest":0,"confim":"0","validate":"0","memo":""};
		
		for(var j=0;j<datas.length;j++)
		{
			var date = datas[j].date;
			if(_d==date)
			{
				obj = datas[j];
				datas.splice(j,1);
				break;
			}
		}
		//obj.status = status;
		cdata.push(obj);
	}
	return cdata;
},

	//休息日
	exports.restdate = function(str) {
		var rtn = false;
		var a =  str.substring(0,4)+"-"+ str.substring(4,6)+"-" + str.substring(6,8);
		var _w = new Date(Date.parse(a)).getDay();
		if((_w == 6)||(_w == 0))
		{
			rtn = true;
		}
		
		return rtn;
    };

exports.edit = function (req, res, next) {
  var id = req.params.id;
  db.wk.findById(id, function (err, row) {
    if (err) {
      return next(err);
    }
    if (!row) {
      return next();
    }
    res.render('wk/edit.html', {wk: row});
  });
};

exports.save = function (req, res, next) {
  var id = req.params.id;
  var title = req.body.title || '';
  title = title.trim();
  if (!title) {
    return res.render('error.html', {message: '标题是必须的'});
  }
  db.wk.updateById(id, {$set: {title: title}}, function (err, result) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};

exports.delete = function (req, res, next) {
  var id = req.params.id;
  db.wk.removeById(id, function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};

exports.finish = function (req, res, next) {
  var finished = req.query.status === 'yes' ? 1 : 0;
  var id = req.params.id;
  db.wk.updateById(id, {$set: {finished: finished}}, function (err, result) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};


function crypt(info)
{
	var content = info;
	var shasum = crypto.createHash('sha1');
	shasum.update(content);
	return shasum.digest('hex');
}