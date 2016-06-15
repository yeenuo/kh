var mysql = require('mysql');
var config = require("./config");
//连接数据库
var conn = mysql.createConnection(config.db)
conn.connect();

exports.new = function () {
	return mysql.createConnection(config.db);
};
exports.connect = function () {
	conn.connect();
};
exports.test = function () {
	var conn = mysql.createConnection(config.db);
	conn.connect();
	conn.query("SELECT token solution FROM japan.`User` where userId ='rfl'", function(err, rows, fields) {
    if (err) throw err;
		 console.log('The solution is: ', rows[0].solution);
	});
	conn.end();
};

exports.q = function (sql,params,func) {
	console.log(sql);
	console.log(params);
	var rtn;
	conn.query(sql,params, function(err, rows, fields) {
		if (err) 
		{
			throw err;
		}
		console.log('The data record is: ', rows.length);
		if(func)
		{
			func(rows);
		}
		
	});
};


//更新增加
//var  userAddSql = 'INSERT INTO userinfo(Id,UserName,UserPass) VALUES(0,?,?)';
//var  userAddSql_Params = ['Wilson', 'abcd'];
//var userModSql = 'UPDATE userinfo SET UserName = ?,UserPass = ? WHERE Id = ?';
//var userModSql_Params = ['USER', '5678',1];
exports.c = function(sql,params,callback)
{
	console.log(sql);
	console.log(params);
	conn.query(sql,params,function (err, result) {
		if(err){
			console.log('[UPDATE ERROR] - ',err.message);
			return;
		}       
		console.log('--------------------------UPDATE----BY--RFL----------------------');
		console.log('UPDATE affectedRows',result.affectedRows);
		console.log('-----------------------------------------------------------------');
		if(callback)
		{
			callback(result);
		}
		
	});
};

exports.i = function(data,callback)
{
	var obj = insertSql(data);
	return  exports.c(obj.sql,obj.param,callback)
};
exports.u = function(data,callback)
{
	var obj = updateSql(data);
	 return exports.c(obj.sql,obj.param,callback)
};

exports.d = function(data,callback)
{
	var obj = deleteSql(data);
	return exports.c(obj.sql,obj.param,callback)
};


function insertSql(data)
{

	//var  userAddSql = 'INSERT INTO userinfo(Id,UserName,UserPass) VALUES(0,?,?)';
	var rtn = {};
	rtn.param = [];
	rtn.sql = "";
	rtn.sql+="INSERT INTO  ";
	rtn.sql+=data.table;
	rtn.sql+="  (";
	for(var key in data)
	{
		if((key!="table")&&(key!="id")&&(key!="option")&&(data[key]!=null))
		{
					rtn.sql+=" ";
					rtn.sql+=key;
					rtn.sql+=",";
		}
	}
	rtn.sql = rtn.sql.substr(0, rtn.sql.length-1);//去除,
	rtn.sql+="  ) VALUES(";
		for(var key in data)
	{
		if((key!="table")&&(key!="id")&&(key!="option")&&(data[key]!=null))
		{
					rtn.sql+="?,";
					rtn.param.push(data[key]);
		}
	}
	rtn.sql = rtn.sql.substr(0, rtn.sql.length-1);//去除,
	rtn.sql+="  )";
	return rtn;
}
//'UPDATE userinfo SET UserName = ?,UserPass = ? WHERE Id = ?
function updateSql(data)
{
	var rtn = {};
	rtn.sql = "";
	rtn.param = [];
	rtn.sql+="UPDATE ";
	rtn.sql+=data.table;
	rtn.sql+="  SET ";

	for(var key in data)
	{
		if((key!="table")&&(key!="id")&&(key!="option")&&(data[key]!=null))
		{
					rtn.sql+=" ";
					rtn.sql+=key;
					rtn.sql+=" = ?,";
					rtn.param.push(data[key]);
		}
	}
	rtn.sql = rtn.sql.substr(0, rtn.sql.length-1);//去除,
	rtn.sql+="  WHERE Id = ? ";
	rtn.param.push(data["id"]);
	console.log(rtn.sql);
	console.log(rtn.param);
	return rtn;
}

//'UPDATE userinfo SET UserName = ?,UserPass = ? WHERE Id = ?
function deleteSql(data)
{
	var rtn = {};
	rtn.sql = "";
	rtn.param = [];
	rtn.sql+="DELETE FROM ";
	rtn.sql+=data.table;
	rtn.sql+="  WHERE Id = ? ";
	rtn.param.push(data["id"]);
	console.log(rtn.sql);
	return rtn;
}