Ext.define('ux.BMap', {
    alternateClassName: 'bMap',
    extend: 'Ext.Container',
    xtype: 'bMap',
    requires: ['Ext.util.Geolocation'],
    bmap: null,
    infoWindow: null,
    app: null,
    config: {
        //私有变量，地图对象
        map: null,
        /// <summary>
        /// 地图初始化配置
        /// </summary>
        /// <param name="locate">是否加载定位控件</param>
        mapOptions: {},
        //初始配置
        //中心点，可以是城市名称，也可以是{lng:'',lat:''}格式的坐标数据
        center: '青岛',
        //是否监听标点的点击事件
        markerTap: false,
        //私有变量，定位按钮
        locate: null,
        //私有变量，定位控件
        geo: null,
        //注意，填充数据需要在showMap事件触发之后才可以
        //store数据源lng,lat这两个字段必须有
        store: null,
        //data数据源，格式为[{lng:'',lat:''}]
        data: null,
        //百度服务密钥,没有的话不会进行坐标转换，定位会有一定的误差参考http://developer.baidu.com/map/changeposition.htm
        ak: null,
        //lng坐标name
        lngName: 'lng',
        //lat坐标name
        latName: 'lat',
        //本地搜素关键词
        key: null,
        //根据地址直接解析坐标，可以是单个地址，也可以是[{address:'地址'}]数组，可以有其他参数
        address: null
    },
    //初始化
    initialize: function () {
        var me = this;
        me.callParent();
        //视图绘制完成后再加载百度地图，以免地图加载出错
        me.on({
            painted: 'initMap',
            scope: me
        });
    },
    //初始化地图
    initMap: function () {
        var me = this, map = me.getMap();
        if (!map) {
            //初始化地图
            //获取地图初始化配置
            var mapOptions = me.getMapOptions(),
            //获取中心点
                center = me.getCenter(),
            //获取搜索key
                key = me.getKey(),
            //获取地址
                address = me.getAddress(),
            //获取数据源
                store = me.getStore(),
                point;
            //创建地图
            map = new BMap.Map(me.element.dom);
            me.bmap = map;
            //获取中心点
            if (Ext.isString(center)) {
                point = center;
            } else if (Ext.isObject(center)) {
                point = BMap.Point(center.lng, center.lat);
            } else {

            }
            //设置中心点和地图显示级别
            map.centerAndZoom(point, 16);


            //添加地图缩放控件
            //map.addControl(new BMap.ZoomControl());
            //判断是否加载定位控件
            if (mapOptions.locate) {
                //加载定位控件
                map.addControl(new BMap.GeolocationControl());//
            }
            map.addControl(new BMap.NavigationControl());
            //map.addControl(new BMap.ScaleControl());//比例尺
            map.addControl(new BMap.OverviewMapControl());
            map.addControl(new BMap.MapTypeControl());
            //设置地图对象，方便在其他地方获取到地图对象
            me.setMap(map);
            //关键词搜索
            if (key) {
                me.search(key);
            }
            //地址解析
            if (address) {
                me.setMarkerbyAddress(address);
            }
            //加载store
            if (store && store.getCount()) {
                me.onLoad(store);
            }


            //地图加载完毕触发事件
            me.fireEvent('showMap', me);
        }
    },
    //数据源事件
    storeEventHooks: {
        load: 'onLoad'
    },
    loadMap: function () {
        var me = this;
        return me.getMap();
    },
    /**
     * 填充数据
     * @param data
     * @param isAdd true:add
     */
    updateData: function (data, isAdd) {
        var me = this,
            store = me.getStore();
        if (data.length > 0) {

            if (!store) {
                me.setStore(Ext.create('Ext.data.Store', {
                    data: data,
                    autoDestroy: true
                }));
            } else {
                if (isAdd) {
                    store.addData(data);
                }
                else {
                    store.setData(data);
                }

            }
        }

    },
    //创建store
    applyStore: function (store) {
        var me = this,
            bindEvents = Ext.apply({},
                me.storeEventHooks, {
                    scope: me
                });
        //获取store,绑定事件
        if (store) {
            store = Ext.data.StoreManager.lookup(store);
            store.onAfter(bindEvents);
        }
        return store;
    }
    ,
//更新store
    updateStore: function (newStore, oldStore) {
        var me = this,
            map = me.getMap(),
            bindEvents = Ext.apply({},
                me.storeEventHooks, {
                    scope: me
                });
        //移除绑定事件，销毁
        if (oldStore && Ext.isObject(oldStore) && oldStore.isStore) {
            oldStore.un(bindEvents);
            if (oldStore.getAutoDestroy()) {
                oldStore.destroy();
            }
        }
        if (map && newStore.getCount()) {
            me.onLoad(newStore);
        }
    }
    ,
//数据加载成功,加载坐标点
    onLoad: function (store) {
        var me = this,
            map = me.getMap(),
            lngName = me.getLngName(),
            latName = me.getLatName(),
            marker,
            item;
        map.clearOverlays();
        store.each(function (record, index, length) {
            item = record.getData();
            me.addPoint(item[lngName], item[latName], item, me, map);
        });
    }
    ,

    addP: function (item, isAdd) {
        var me = this;
        var item = me.addPoint(item[me.getLngName()], item[me.getLatName()], item, me);
        if (isAdd) {
            item.isAdd = true;//自己添加
            item.enableDragging();
        }

        return item;
    }
    ,

//添加单个点
    addPoint: function (lng, lat, item, me, map) {


        if (!me) {
            me = this;
        }
        if (!map) {
            map = me.getMap();
        }
        if (lng && lat) {
            // 创建标注
            var marker = new BMap.Marker(new BMap.Point(lng, lat));
            //其他数据
            marker.options = {};
            //将模型中的其他数据添加到按钮中
            for (var name in item) {
                marker.options[name] = item[name];
            }
            if (me.getMarkerTap()) {
                //添加点击监听
                marker.addEventListener("click",
                    function (type, target) {
                        me.fireAction('tapMarker', [me, this], 'onTapMarker');
                    });
            }
            // 将标注添加到地图中
            map.addOverlay(marker);
            return marker;
        }
    }
    ,
//获取定位控件
    getLocateControl: function () {
        //创建控件
        var locateControl = new BMap.Control();
        //设置方位
        locateControl.defaultAnchor = BMAP_ANCHOR_BOTTOM_LEFT;
        //设置坐标
        locateControl.defaultOffset = new BMap.Size(200, 200);
        //设置dom
        locateControl.initialize = function (map) {
            var zoom = document.createElement("div");
            zoom.className = 'BMap_ZoomCtrl zoom_btn locateControl';
            var location = document.createElement("div");
            location.style.height = 50;
            location.style.width = 50;
            location.className = 'location';
            zoom.appendChild(location);
            map.getContainer().appendChild(zoom);
            return zoom;
        }
        //监听点击事件
        this.element.on({
            tap: 'onLocate',
            delegate: 'div.locateControl',
            scope: this
        });
        return locateControl;
    }
    ,
//点击定位按钮
    onLocate: function (e) {
        var el = e.getTarget('div.location', null, true);
        el.addCls('locationGif');
        this.setLocate(el);
        //触发定位事件
        this.setGeo(true);
    }
    ,
//创建定位插件
    applyGeo: function (config) {
        return Ext.factory(config, Ext.util.Geolocation, this.getGeo());
    }
    ,
//更新定位插件
    updateGeo: function (newGeo, oldGeo) {
        var events = {
            locationupdate: 'onGeoUpdate',
            locationerror: 'onGeoError',
            scope: this
        };

        if (oldGeo) {
            oldGeo.un(events);
        }

        if (newGeo) {
            newGeo.on(events);
            newGeo.updateLocation();
        }
    }
    ,
// 定位成功，设置中心点
    onGeoUpdate: function (geo) {
        var me = this,
            ak = me.getAk();
        if (ak) {
            Ext.Ajax.request({
                url: 'http://api.map.baidu.com/geoconv/v1/?',
                params: {
                    coords: geo.getLongitude() + ',' + geo.getLatitude(),
                    ak: ak
                },
                scope: me,
                success: function (data) {
                    data = Ext.decode(data.responseText).result[0];
                    if (data) {
                        me.addMyPoint(data.x, data.y);
                    }
                }
            });
        } else {
            me.addMyPoint(geo.getLongitude(), geo.getLatitude());
        }
    }
    ,
//添加我的坐标
    addMyPoint: function (lng, lat) {
        var me = this,
            map = me.getMap(),
            icon = new BMap.Icon("resources/icons/markers.png", new BMap.Size(25, 25), {
                imageOffset: new BMap.Size(0, 0)
            }),
            point = new BMap.Point(lng, lat),
            marker = new BMap.Marker(point, {
                icon: icon
            });
        // 将标注添加到地图中
        map.addOverlay(marker);
        map.setCenter(point);
        me.unLocate();
    }
    ,
// 定位失败
    onGeoError: function () {
        this.unLocate();
        //触发事件
        this.fireEvent('geoError', this);
    }
    ,
//取消定位动画
    unLocate: function () {
        var locate = this.getLocate();
        if (locate) {
            locate.removeCls('locationGif');
        }
    }
    ,
//更新搜索关键词
    updateKey: function (value) {
        var me = this,
            map = me.getMap();
        if (map && value) {
            me.search(value);
        }
    }
    ,
/// <summary>
/// 搜索
/// </summary>
/// <param name="key">关键词：String|Array<String></param>
/// <param name="unClear">是否不清除覆盖物</param>
    search: function (key, unClear) {
        var map = this.getMap();
        !unClear && map.clearOverlays();
        var local = new BMap.LocalSearch(map, {
            renderOptions: {
                map: map,
                autoViewport: true
            }
        });
        local.setSearchCompleteCallback(function (bo) {
            console.log(bo);
            if (bo._currentNumPois == 0) {
                Ext.toast('请输入正确的检索条件！');
            }
        });
        local.search(key);
    }
    ,
/// <summary>
/// 根据中心点与检索词发起周边检索
/// </summary>
/// <param name="key">关键词：String|Array<String></param>
/// <param name="by">中心点：LocalResultPoi|String|Point</param>
/// <param name="unClear">是否不清除覆盖物</param>
    searchNearby: function (key, by, unClear) {
        var map = this.getMap();
        !unClear && map.clearOverlays();
        var local = new BMap.LocalSearch(map, {
            renderOptions: {
                map: map,
                autoViewport: true
            }
        });
        local.searchNearby(key, by);
    }
    ,
/// <summary>
/// 设置地图中心
/// </summary>
/// <param name="point"></param>
    setMapCenter: function (lng, lat) {
        var map = this.getMap();
        if (map) {
            map.setCenter(new BMap.Point(lng, lat));
        }
    }
    ,
//更新地址
    setMarkerbyAddress: function (address) {
        var me = this;
        if (address) {
            if (Ext.isArray(address)) {
                for (var i = 0; i < address.length; i++) {
                    me.getMarkerbyAddress(address[i].address, address[i]);
                }
            } else if (Ext.isString(address)) {
                me.getMarkerbyAddress(address);
            }
        }
    }
    ,
//根据地址解析坐标
    getMarkerbyAddress: function (address, params) {
        var me = this,
            ak = me.getAk();
        if (ak) {
            Ext.Ajax.request({
                url: 'http://api.map.baidu.com/geocoder/v2/?',
                myParams: params,
                params: {
                    address: address,
                    ak: ak,
                    output: 'json'
                },
                scope: me,
                success: function (data) {
                    var response = Ext.decode(data.responseText),
                        location;
                    if (response.status == 0) {
                        location = response.result.location;
                        me.addPoint(location.lng, location.lat, data.request.options.myParams);
                    } else {
                        if (!params) {
                            Ext.toast('请输入正确的检索条件！');
                        }
                    }
                }
            });
        } else {
            Ext.Logger.error('请设置百度服务ak！');
        }
    }
})
;
Ext.define('app.view.Map', {
    alternateClassName: 'map',
    extend: 'ux.BMap',
    xtype: 'map',
    config: {
        height: "80%",
        width: "100%",
        title: '地图',
        /// <summary>
        /// 地图配置
        /// </summary>
        /// <param name="locate">是否加载定位控件</param>
        mapOptions: {
            locate: true
        },
        data: [],
        //是否监听标点的点击事件
        markerTap: true
    },
    //点击坐标处理
    onTapMarker: function (me, marker) {
        var content = '<div style="margin:0;line-height:20px;padding:2px;">' +
            "<table><tr><td>"
            + marker.options.title
            + "</td></tr><tr><td>"
            + marker.options.info
        '</td></tr></table></div>';
        me.infoWindow = new BMap.InfoWindow(content);
        //marker.openInfoWindow(me.infoWindow);
        me.app.showWindow(marker);


    }
});
