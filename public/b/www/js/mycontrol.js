var map;
window.onload = function() {
  // 百度地图API
  map = new BMap.Map("l-map", {minZoom:15}); //初始化地图，规定最小缩放
  map.centerAndZoom(new BMap.Point(113.402364,23.056676), 16); //显示中心
  map.enableScrollWheelZoom(); //启用滚轮缩放

  var top_right_navigation = new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT, type: BMAP_NAVIGATION_CONTROL_SMALL});//右上角平移和缩放按钮
  map.addControl(top_right_navigation);
  /* 由于设置了地图边界，即拖拽地图至超出“大学城”范围时地图会自动弹回，所以使用平移按钮时它可能会出现自己和自己较劲儿的现象 */

  var b = new BMap.Bounds(new BMap.Point(113.363465,23.033239),new BMap.Point(113.42225,23.081655));
  try {
    BMapLib.AreaRestriction.setBounds(map, b); //设置边界
  } catch (e) {
    alert(e);
  }
};

function myCtrl($scope){
  $scope.go = function() {
    document.getElementById('r-result').innerHTML = '';
    map.clearOverlays(); //清空地图所有标注

    var local = new BMap.LocalSearch(map, {
      renderOptions:{
        map: map,
        panel: "results"
      }
    });

    var b = new BMap.Bounds(new BMap.Point(113.363465,23.033239),new BMap.Point(113.42225,23.081655));
    BMapLib.AreaRestriction.setBounds(map, b);

    var s_marker = null; //起点marker
    var e_marker = null; //终点marker

    local.searchInBounds($scope.init, map.getBounds()); //在“大学城”范围内进行搜索
    local.setMarkersSetCallback(function (pois) { //插入marker的回调函数
      for(var i = 0; i < pois.length; i++){
        var marker = pois[i].marker;
        marker.addEventListener("click", function(){ //添加监听事件
          marker_trick = true;
          var pos = this.getPosition();
          setAdress_s(pos.lng, pos.lat);
        });
      }
    })

    function setAdress_s(s_lng, s_lat) {
      if (confirm("设为起点？")) {
        map.clearOverlays();
        s_marker = new BMap.Marker(new BMap.Point(s_lng, s_lat));
        map.addOverlay(s_marker); //创建标注

        local.searchInBounds($scope.ended, map.getBounds());
        local.setMarkersSetCallback(function (pois) {
          //此函数写在setAdress_s里面保证先设置了起点后再设置终点
          for(var i = 0; i < pois.length; i++){
            var e_marker = pois[i].marker;
            e_marker.addEventListener("click", function(){
              marker_trick = true;
              var pos = this.getPosition();
              setAdress_e(pos.lng, pos.lat);
            });
          }
        })

        function setAdress_e(e_lng, e_lat) {
          if (confirm("设为终点？")) {
            map.clearOverlays();
            e_marker = new BMap.Marker(new BMap.Point(e_lng, e_lat));
            map.addOverlay(e_marker);

            var transit = new BMap.TransitRoute(map, {
              renderOptions: {
                map: map,
                panel: "r-result" //将结果显示在$('#r-result')中
              }
            });
            transit.search(s_marker.getPosition(), e_marker.getPosition()); //公交线路查询
          }
        }
      }
    }

  }
}/**
 * Created by RFL on 2016/7/6.
 */
