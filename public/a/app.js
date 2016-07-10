//<debug>
Ext.Loader.setPath({
    'Ext': '../../src'
});
//</debug>

/**
 * This simple example shows the ability of the Ext.List component.
 *
 * In this example, it uses a grouped store to show group headers in the list. It also
 * includes an indicator so you can quickly swipe through each of the groups. On top of that
 * it has a disclosure button so you can disclose more information for a list item.
 */

//define the application
var app = Ext.application({
    isIconPrecomposed: false,
    //require any components/classes what we will use in our example
    requires: [
        'Ext.MessageBox',
        'OpenCharts.OpenCharts',
        'Ext.data.Store'
    ],

    /**
     * The launch method is called when the browser is ready, and the application can launch.
     *
     * Inside our launch method we create the list and show in in the viewport. We get the lists configuration
     * using the getListConfiguration method which we defined below.
     *
     * If the user is not on a phone, we wrap the list inside a panel which is centered on the page.
     */

    initConfig: function () {
        var me = this;
        me.user = -1;
        me.data = {};//当前选中data,便于删除修改添加用
        me.datas = {"need": [], "help": []};

        me.infoType = 0;//0:求助 1:帮忙


        me.tomail = "";//需要发送mail的人，作业时间不足。
        me.config = {
            isAdd: false,//是否自己添加
            itemType: 0,//0 need 1 help
            needTxt: '求助',
            helpTxt: '帮忙',
            helps: [{id: -1, text: '--类别--'}, {id: 0, text: '活动'}, {id: 1, text: '打折'}, {id: 2, text: '归还'}, {
                id: 3,
                text: '二手'
            }]
            ,
            needs: [{id: -1, text: '--类别--'}, {id: 0, text: '寻物'}, {id: 1, text: '寻人'}, {id: 2, text: '问答'}, {
                id: 3,
                text: '求购'
            }, {
                id: 4,
                text: '其他'
            }]
            ,
            distances: [{id: -1, text: '--距离--'}, {id: 0, text: '200M'}, {id: 1, text: '500M'}, {
                id: 2,
                text: '1KM'
            }, {id: 3, text: '3KM'}, {
                id: 4,
                text: '10KM'
            }, {id: 3, text: '3KM'}, {
                id: 4,
                text: '以上'
            }]
            ,
            relations: [{id: 0, text: '普通'}, {id: 1, text: '朋友'}, {id: 2, text: '密友'}]
            , status: [{id: 0, text: '确认中'}, {id: 1, text: '帮助中'}, {id: 2, text: '已完成'}]
            ,
            levels: [{id: 0, text: '>10'}, {id: 1, text: '>5'}, {id: 2, text: '>2'}, {id: 3, text: '>0'}]
            ,
            points: [{id: -1, text: '--分数--'}, {id: 0, text: '0'}, {id: 1, text: '<10'}, {id: 2, text: '<20'}, {
                id: 3,
                text: '<50'
            }, {
                id: 4,
                text: '<100'
            }, {id: 5, text: '100以上'}]
        };

        me.map = null;
        me.sel_distance = null;
        me.sel_help = null;
        me.sel_kind = null;
        me.sel_point = null;
        me.seg_type = null;
        me.marker = null;
    },
    launch: function () {
        var me = this;
        this.tool = new Tool();
        me.initConfig();
        me.panel_info = me.getInfo();
        me.panel_list = me.getList();//列表
        me.panel_map = me.getMap();//录入
        me.panel_config = me.getConfig();//设定
        me.mainPanel = Ext.create('Ext.TabPanel', {
            tabBarPosition: 'bottom',
            id: 'panel_main',
            fullscreen: true,
            showAnimation: {
                type: 'cube'
            },
            layout: {
                type: 'card',
                animation: {
                    type: 'cube'
                }
            },
            defaults: {
                styleHtmlContent: true
            },
            activeItem: 1,
            items: [
                me.panel_list,
                me.panel_map,
                me.panel_config,
                me.getLogin()//登陆页面
            ]
        });
        //Ext.getCmp('panel_main').setActiveItem(3);//初次启动，登录页面

        me.mainPanel.on("activeitemchange", function (tb, value, oldValue, eOpts) {
            if (me.user == -1) {
                //Todo
                // Ext.getCmp('panel_main').setActiveItem(3);//初次启动，登录页面
            }

        });
    },

    getLogin: function () {
        var me = this;
        return {
            title: '登録',
            iconCls: 'user',
            id: 'tab_login',
            layout: 'vbox',
            items: [
                {
                    xtype: 'textfield',
                    id: 'name',
                    name: 'name',
                    label: 'ユーザ',
                    value: 'tj1'
                },
                {
                    xtype: 'passwordfield',
                    id: 'password',
                    name: 'password',
                    label: '暗証番号',
                    value: '111111'
                },
                {
                    xtype: 'button',
                    text: '登録',
                    handler: function () {
                        me.initConfig();//初始化配置
                        var name = Ext.getCmp("name").getValue();
                        var password = Ext.getCmp("password").getValue();

                        if ((name == "") || (password == "")) {
                            alert("用户名或密码不得为空。");
                            return;
                        }
                        var data = {"name": name, "password": password};
                        Ext.Ajax.request({
                            url: '../../login',
                            method: 'POST',
                            params: data,
                            success: function (response, opts) {
                                var obj = Ext.decode(response.responseText);
                                if (obj.success) {//登陆成功
                                    me.user = obj.user;
                                    me.role = obj.role;
                                    if (me.role == 1) {
                                        Ext.getCmp("panel_main").getTabBar().items.items[4].show();
                                        me.adminstore.load();
                                    }
                                    else {
                                        Ext.getCmp("panel_main").getTabBar().items.items[4].hide();
                                    }
                                    Ext.getCmp("lbl_user_name").setHtml(data.name);
                                    Ext.getCmp("month").setValue(new Date());
                                    me.loadConfigData(//读取配置数据
                                        function (rtn) {
                                            if (rtn.success) {
                                                me.store.load({
                                                    params: {
                                                        'user': me.user,
                                                        'month': me.month
                                                    }
                                                });
                                                if (me.role == 1) {
                                                    Ext.getCmp('panel_main').setActiveItem(4);
                                                }
                                                else {
                                                    Ext.getCmp('panel_main').setActiveItem(0);
                                                }

                                            }
                                            else {
                                                alert("まず各設定を入力してください。");
                                                Ext.getCmp('panel_main').setActiveItem(2);
                                            }
                                        }
                                    );

                                }
                                else {
                                    alert("用户名或密码错误。");
                                }
                                console.dir(obj);
                            },
                            failure: function (response, opts) {
                                console.log('server erro:' + response.status);
                            }
                        });
                    }
                },
                {
                    xtype: 'button',
                    text: '暗証番号リセット',
                    handler: function () {
                        var name = Ext.getCmp("name").getValue();
                        if (name.length == 0) {
                            alert('名前を入力してください。');
                            return;
                        }
                        Ext.Msg.prompt('EMAIL', 'EMAILを入力してください。', function (id, text) {
                            text = "javaandnet@gmail.com";//Todo
                            if (text.length > 0) {
                                me.resetPWD(text);
                            }

                        });
                    }
                }
            ]
        };
    },


    getInfo: function () {
        var me = this;
        return Ext.create("Ext.Panel", {
            centered: true,
            modal: true,
            width: 300,
            height: 400,
            hidden: true,
            items: [
                {
                    docked: 'top',
                    xtype: 'titlebar',
                    items: [
                        {
                            text: '关闭',
                            handler: function () {
                                me.panel_info.setHidden(true);
                            }
                        }
                    ]
                },

                //类别
                {
                    id: 'show_need',
                    xtype: 'selectfield',
                    label: '类别',
                    valueField: 'id',
                    options: me.config.needs
                },
                {
                    id: 'show_help',
                    xtype: 'selectfield',
                    hidden: true,
                    label: '类别',
                    valueField: 'id',
                    options: me.config.helps
                },
                //题目
                {
                    id: 'show_title',
                    xtype: 'textfield',
                    label: '标题'


                },
                //详细信息
                {
                    id: 'show_info',
                    xtype: 'textfield',
                    label: '信息'
                },
                //分数
                {
                    xtype: 'sliderfield',
                    id: 'show_point',
                    label: '分数(0)',
                    value: 0,
                    minValue: 0,
                    maxValue: 100,
                    listeners: {
                        change: function (me, sl, thumb, value, pressed) {
                            me.setLabel("分数(" + value + ")");

                        }
                    }
                },//状态
                {
                    xtype: 'selectfield',
                    id: 'show_status',
                    label: '类别',
                    valueField: 'id',
                    options: me.config.status
                }, {
                    xtype: 'button',
                    text: '保存',
                    handler: function () {
                        me.saveData("NEED");
                    }
                }

            ]
        });
    },

    saveData: function (model) {
        var me = this;
        me.setData();
        me.data.table = model;
        me.data.option = "s";
        me.submitData(me.data, function () {
            me.panel_info.setHidden(true);
        });
    },
    getList: function () {
        var me = this;
        return {
            title: '一覧',
            iconCls: 'calendar',
            id: 'tab_list',
            layout: 'card',
            items: [me.getListConfiguration()]
        };
    },
    getComboText: function (key, objs) {
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            if (obj.value == key) {
                return obj.text;
            }
        }
        return null;
    },
    getConfig: function () {
        var me = this;
        return {
            title: '設定',
            iconCls: 'settings',
            scrollable: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '暗証番号変更',
                    items: [
                        {
                            xtype: 'passwordfield',
                            id: "oldpwd",
                            name: 'oldpwd',
                            label: '元暗証番号',
                            value: ''
                        },
                        {
                            xtype: 'passwordfield',
                            id: "newpwd",
                            name: 'newpwd',
                            label: '新暗証番号',
                            value: ''
                        },
                        {
                            xtype: 'passwordfield',
                            id: "newpwd2",
                            name: 'newpwd2',
                            label: '再入力（確認）',
                            value: ''
                        }, {
                            xtype: 'button',
                            text: '変更',
                            handler: function () {
                                me.changePWD(Ext.getCmp("oldpwd").getValue(), Ext.getCmp("newpwd").getValue(), Ext.getCmp("newpwd2").getValue());
                            }
                        }
                    ]
                }
            ]
        };
    },
    getMap: function () {

        var dt = Ext.Date.add(new Date(), Ext.Date.DAY, 1);
        var me = this;
        me.map = Ext.create("map");
        me.map.app = me;
        me.sel_point = {
            id: 'sel_point',
            xtype: 'selectfield',
            label: ' ',
            valueField: 'id',
            options: me.config.points
        };
        me.sel_kind = {
            id: 'sel_kind',
            xtype: 'selectfield',
            label: ' ',
            valueField: 'id',
            options: me.config.kinds
        };

        me.sel_distance = {
            id: 'sel_distance',
            xtype: 'selectfield',
            label: ' ',
            valueField: 'id',
            options: me.config.distances
        };

        me.sel_level = {
            id: 'sel_level',
            xtype: 'selectfield',
            label: ' ',
            valueField: 'id',
            options: me.config.distances
        };
        me.sel_help = {
            id: 'sel_help',
            xtype: 'selectfield',
            label: ' ',
            hidden: true,
            valueField: 'id',
            options: me.config.helps
        };
        me.btn_search =
        {
            xtype: 'button',
            text: '刷新',
            id: "btn_search",
            iconCls: 'search',
            name: "btn_search",
            align: 'right',
            handler: function () {
                //var month = Ext.Date.format(Ext.getCmp("month_admin").getValue(), "Ym");
                //window.open("/excel/" + month, '_blank');
                me.refreshData(1);
            }
        };
        me.btn_add =
        {
            xtype: 'button',
            text: '添加',
            id: "btn_add",
            iconCls: 'add',
            name: "btn_add",
            align: 'right',
            handler: function (btn) {
                //var month = Ext.Date.format(Ext.getCmp("month_admin").getValue(), "Ym");
                //window.open("/excel/" + month, '_blank');
                me.addItem();
            }
        };

        me.seg_type = Ext.create('Ext.SegmentedButton', {
            items: [
                {
                    text: me.config.needTxt,
                    value: 0,
                    pressed: true
                },
                {
                    text: me.config.helpTxt,
                    value: 1
                }
            ],
            listeners: {
                toggle: function (container, button, pressed) {

                    var type = 0;

                    if (pressed) {
                        if (button.getText() == me.config.needTxt) {
                            type = 1;
                        }
                        me.changeInfoType(type);
                    }

                }
            }
        });


        return {
            title: '求助',
            iconCls: 'compose',
            id: 'tab_input',
            layout: 'vbox',
            items: [
                {
                    docked: 'top',
                    xtype: 'titlebar',
                    items: [
                        me.seg_type,
                        me.btn_search,
                        me.btn_add
                    ]
                },
                me.panel_info,
                me.map,
                {
                    xtype: 'fieldset',
                    width: '100%',
                    hideBorders: false,
                    layout: 'hbox',
                    baseCls: "x-fieldset_nb", //无边框
                    defaults: {
                        width: '30%'

                    },
                    items: [
                        me.sel_distance,
                        me.sel_help,
                        me.sel_kind,
                        me.sel_point,
                    ]
                }
            ]
        };
    },
    showWindow: function (marker) {
        var me = this;

        me.marker = marker;

        me.getData();
        me.panel_info.setHidden(false);//显示
    },
    getParam: function () {
        var param = {model: "NEED"};
        return param;
    },
    /**
     * 刷新数据
     * @param flag 0:本地刷新 1:服务器刷新
     */
    refreshData: function (flag) {
        var me = this;
        var param = me.getParam();

        if (flag == 0) {
            me.refreshLocal(param, me.refreshMap);
        }
        else {
            me.refreshServer(param, me.refreshMap);
        }


    },

    refreshServer: function (param, cb) {
        var me = this;
        Ext.Ajax.request({
            url: '../../data',
            method: 'POST',
            params: param,
            success: function (response, opts) {
                var obj = Ext.decode(response.responseText);

                cb(obj, me);
                console.dir(obj);
            },
            failure: function (response, opts) {
                console.log('server erro:' + response.status);
            }
        });
    },

    refreshLocal: function (param) {

    },

    //刷新页面
    refreshMap: function (datas, me) {
        me.map.updateData(datas);

    },


    addItem: function () {
        var me = this;
        var a = me.map.bmap.getCenter();
        a.title = "1111111";
        a.info = "aaaaasaasasas";
        var item = me.map.addP(a, true);
        me.map.updateData(a, true);

    },

    changeInfoType: function (type) {
        var me = this;
        me.infoType = type;
        if (type == 0) {//Help
            console.log("help");
            me.getCmpById(me.sel_help).setHidden(true);
            Ext.getCmp("show_help").setHidden(true);
            me.getCmpById(me.sel_kind).setHidden(false);
            Ext.getCmp("show_need").setHidden(false);
            me.getCmpById(me.sel_point).setHidden(false);
            //me.sel_help.hidden = true;
            // me.sel_kind.hidden = false;
        }
        else {
            console.log("need");
            me.getCmpById(me.sel_help).setHidden(false);
            Ext.getCmp("show_help").setHidden(false);
            me.getCmpById(me.sel_kind).setHidden(true);
            Ext.getCmp("show_need").setHidden(true);
            me.getCmpById(me.sel_point).setHidden(true);
        }


    },
    getCmpById: function (obj) {
        return Ext.getCmp(obj.id);
    },
    resetPWD: function (email) {
        var data = {"name": Ext.getCmp("name").getValue(), "email": email, option: "r"};
        Ext.Ajax.request({
            url: '../../rspwd',
            method: 'POST',
            params: data,
            success: function (response, opts) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    alert("リセットしました。请查看邮件。");
                }
                else {
                    alert("リセット失敗、EMAIL入力错误。");
                }
                console.dir(obj);
            },
            failure: function (response, opts) {
                console.log('server erro:' + response.status);
            }
        });
    },
    changePWD: function (pwd, newpwd, newpwd2) {
        if (newpwd != newpwd2) {
            alert("新しい暗証番号と確認用暗証番号が一致してない。");
            return;
        }
        var me = this;
        var data = {user: me.user, "password": pwd, "newpassword": newpwd, option: "c"};
        Ext.Ajax.request({
            url: '../../pwd',
            method: 'POST',
            params: data,
            success: function (response, opts) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    alert("変更しました。");
                }
                else {
                    alert("変更失敗、暗証番号入力错误。");
                }
                console.dir(obj);
            },
            failure: function (response, opts) {
                console.log('server erro:' + response.status);
            }
        });
    },
    getData: function () {
        var me = this;
        var info = me.marker.options;
        me.data = {};
        me.data.lat = info.lat;
        me.data.lng = info.lng;
        if(info.id)
        {
            me.data.id = info.id;
        }
        var fields = ["title", "status", "point", "info"];
        for (var i = 0; i < fields.length; i++) {
            Ext.getCmp("show_" + fields[i]).setValue(info[fields[i]]);
        }

        if (me.infoType == 0) {//need
            Ext.getCmp("show_need").setValue(me.data["type"]);
        }
        else {
            Ext.getCmp("show_help").setValue(me.data["type"]);
        }
    },
    setData: function () {
        var me = this;
        var fields = ["title", "status", "point", "info"];

        for (var i = 0; i < fields.length; i++) {
            me.data[fields[i]] = Ext.getCmp("show_" + fields[i]).getValue();
        }
        if (me.infoType == 0) {//need
            me.data["type"] = Ext.getCmp("show_need").getValue();
        }
        else {
            me.data["type"] = Ext.getCmp("show_help").getValue();
        }
    },
    //提交数据
    submitData: function (data, callback) {
        var me = this;
        Ext.Ajax.request({
            url: '../../data',
            method: 'POST',
            params: data,
            success: function (response, opts) {
                var obj = Ext.decode(response.responseText);
                if (obj.success) {
                    if (obj.id) {
                        data.id = obj.id;
                        alert("追加成功");
                    } else {
                        alert("更新成功");
                    }
                    // me.store.load({
                    //     params: {
                    //         'user': me.user,
                    //         'month': me.month
                    //     }
                    // });
                    if (callback) {
                        callback();
                    }

                }
                console.dir(obj);
            },
            failure: function (response, opts) {
                console.log('server erro:' + response.status);
            }
        });
    },

    getAdminConfiguration: function () {
        var me = this;

        var month = Ext.create('Ext.field.DatePicker', {
            id: 'month_admin',
            fieldLabel: '月份',
            width: 120,
            xtype: 'datepickerfield',
            dateFormat: "Y-m",
            editable: false
            //value:new Date().dateFormat('Y-m')
        });
        var monthPicker = Ext.create('Ext.picker.Date', {
            yearFrom: 2016,
            yearTo: 2050,
            slotOrder: ['year', 'month']
        });

        month.setPicker(monthPicker);
        month.setValue(new Date());

        month.on("change", function () {
            me.adminstore.load({
                params: {
                    'month': Ext.Date.format(Ext.getCmp("month_admin").getValue(), "Ym")
                }
            });
        });

        var btn_excel =
        {
            xtype: 'button',
            text: 'E',
            id: "btn_excel",
            iconCls: 'organize',
            name: "btn_excel",
            align: 'right',
            handler: function () {
                var month = Ext.Date.format(Ext.getCmp("month_admin").getValue(), "Ym");
                window.open("/excel/" + month, '_blank');
            }
        };

        var btn_sort =
        {
            xtype: 'button',
            text: 'S',
            id: "btn_sort",
            iconCls: 'arrow_down',
            name: "btn_sort",
            align: 'left',
            handler: function () {
                me.adminstore.sort([
                    {
                        property: 'status',
                        direction: 'ASC'
                    },
                    {
                        property: 'no',
                        direction: 'ASC'
                    }
                ]);
            }
        };
        var chart = Ext.create('OpenCharts.charts.PieChart', {
            chartOptions: {
                x: function (d) {
                    return d.label + "(" + d.value + ")";
                },
                y: function (d) {
                    return d.value;
                },
                staggerLabels: true,
                tooltips: false,
                showValues: true
            }
        });

        var popup = new Ext.Panel({
            floating: true,
            centered: true,
            modal: true,
            width: 300,
            height: 400,
            styleHtmlContent: true,
            items: [
                {
                    docked: 'top',
                    xtype: 'titlebar',
                    items: [
                        {
                            text: '閉じる',
                            align: "left",
                            handler: function () {
                                popup.hide();
                            }
                        }
                    ]
                }
            ]
        });
        popup.add(chart);


        var btn_chart =
        {
            xtype: 'button',
            text: 'C',
            id: "btn_chart",
            iconCls: 'info',
            name: "btn_chart",
            align: 'left',
            handler: function (btn) {

                popup.showBy(btn);

                //注意顺序 先生成 再装载数据
                var co = {a: 0, b: 0, c: 0};
                for (var i = 0; i < me.admindatas.length; i++) {
                    var obj = me.admindatas[i];
                    if (obj.status == 0) {
                        co.a++;
                    }
                    else if (obj.status == 1) {
                        co.b++;
                    }
                    else {
                        co.c++;
                    }
                }
                chart.renderChartData([{"label": "正常", "value": co.a}, {"label": "不足", "value": co.b}, {
                    "label": "超える",
                    "value": co.c
                }]);

            }
        };
        var btn_email =
        {
            xtype: 'button',
            text: 'M',
            iconCls: 'reply',
            id: "btn_email",
            name: "btn_email",
            align: 'right',
            handler: function () {
                var data = {"tomail": me.tomail};
                Ext.Ajax.request({
                    url: '../../wk/email',
                    method: 'POST',
                    params: data,
                    success: function (response, opts) {
                        var obj = Ext.decode(response.responseText);
                        if (obj.success) {
                            alert("発送成功。");
                        }
                    },
                    failure: function (response, opts) {
                        console.log('server erro:' + response.status);
                    }
                });
            }
        };

        me.adminstore = Ext.create('Ext.data.Store', {
            //give the store some fields
            fields: ['id', 'eid', 'no', 'name', 'month', 'actualtime', 'alltime', 'mintime', 'maxtime'],
            sorters: 'no',
            listeners: {
                load: function (st, records) {
                    me.tomail = "";
                    me.admindatas = [];
                    for (var i = 0; i < records.length; i++) {
                        var v = records[i].data;
                        v.status = 0;
                        if (v.alltime < v.mintime) {
                            v.status = 1;//不足,需要提醒
                            me.tomail = me.tomail + "," + v.eid + "";
                        }
                        else if (v.alltime > v.maxtime) {
                            v.status = 2;
                        }
                        me.admindatas.push(v);
                    }
                    if (me.tomail.length > 0) {
                        me.tomail = me.tomail.substr(1, me.tomail.length);//去除#
                    }

                }
            },
            proxy: {
                type: 'ajax',
                url: '../../wk/alist',
                reader: {
                    type: 'json',
                    root: 'data'
                },
                actionMethods: {
                    create: 'POST',
                    read: 'POST', // by default GET
                    update: 'POST',
                    destroy: 'POST'
                },
                extraParams: {
                    'month': Ext.Date.format(Ext.getCmp("month_admin").getValue(), "Ym")
                }
            }
        });

        return {
            items: [
                {
                    docked: 'top',
                    xtype: 'titlebar',
                    items: [
                        month
                        , btn_sort
                        , btn_chart
                        , btn_email
                        , btn_excel
                    ]
                }
            ],
            id: 'list_admin',
            xtype: 'list',
            scrollable: {
                direction: 'vertical'
            },
            variableHeights: true,
            itemHeight: 10,
            store: me.adminstore,
            itemTpl: new Ext.XTemplate(
                //'<table><tr><td height="40" bgcolor ="{status}">{[this.date(values.date)]}【{starttime}~{endtime}】:{worktime} ({[this.rest(values.rest)]})</td></tr></table>',
                '<div  class = "{[this.status(values)]}" style="width:100%;height:100%">{name}:{mintime}~{maxtime}【 {actualtime}⇒{alltime}】</div>',
                {
                    status: function (v) {
                        var bgcolor = "";
                        if (v.alltime < v.mintime) {
                            bgcolor = "div_min";
                        }
                        else if (v.alltime > v.maxtime) {
                            bgcolor = "div_max";
                        }
                        console.log(v);
                        console.log(bgcolor);
                        return bgcolor;
                    }
                }
            )
        };
    },


    //列表
    getListConfiguration: function () {
        return {
            xtype: 'button', text: '変更',
            handler: function () {
                me.changePWD(Ext.getCmp("oldpwd").getValue(), Ext.getCmp("newpwd").getValue(), Ext.getCmp("newpwd2").getValue());
            }
        };
    }
});
