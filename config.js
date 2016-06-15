/*!
 * todo - config.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

exports.debug = true;
exports.port = 3000;
exports.email = 'fengmk2@gmail.com';
exports.site_name = 'Node TODO';
exports.site_desc = 'Very simple todo, demo for connect web dev.';
exports.session_secret = 'todo session secret';

exports.db ={
    host: 'japan.cnqxo1udr78c.ap-northeast-1.rds.amazonaws.com',
    user: 'tenji',
    password: 'tenji456$%^',
    database:'WK',
    port: 3306
};

exports.status ={
	f:'yellow',//future未来
    d:'green',//done 已完成
	u:'red',//undo 未做
	n:'gray'//NoNeed 不需要
};


exports.localdb ={
    host: '127.0.0.1',
    user: 'root',
    password: 'tenji123!@#',
    port: 3306
};

exports.mail ={
    host: 'smtp.gmail.com',
	port: 465,
    user: 'tenji0608@gmail.com',
    pass: 'test0608'
};