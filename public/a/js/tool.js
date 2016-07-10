var Tool = new Function();
Tool.prototype = {
    version : "1.0",
    date : function(str) {
		var a =  str.substring(0,4)+"-"+ str.substring(4,6)+"-" + str.substring(6,8);
		return new Date(Date.parse(a));
    },
	timeStr : function(str) {
		var a =  str.substring(0,2)+":"+ str.substring(2,4);
		return a;
    },
	setHM : function(date,hm) {
		if(hm&&hm.length==4)
		{
			var h =  parseInt(hm.substring(0,2));
			var m =  parseInt(hm.substring(2,4));
			date.setHours(h);
			date.setMinutes(m);
		}
    },
	getHM:function(hm)
	{
		var date = new Date();
		this.setHM(date,hm);
		return date;
	},
	pad:function(num, n) {

    var len = num.toString().length;

    while(len < n) {

        num = "0" + num;
        len++;
    }

    return num+"";
},
	day : function(str) {
		return  this.date(str).getDate(); 
    },
	week : function(str) {
		//0星期天
		return  this.date(str).getDay(); 
    },
	jweek: function(str) {
		//0星期天
		var strs = ["日","月","火","水","木","金","土"];
		return  strs[this.week(str)]; 
    },
	getListText:function(key,objs){
		for(var i = 0;i<objs.length;i++)
		{
			var obj = objs[i];
			if(obj.value == key)
			{
				return obj.text;
			}
		}
		return null;
	}
};
/**
Sencha Touch iconCls Values
---------------------------

action
add
arrow_down
arrow_left
arrow_right
arrow_up
bookmarks
compose
delete
download
favorites
home
info
locate
maps
more
organize
refresh
reply
search
settings
star
team
time
trash
user
**/