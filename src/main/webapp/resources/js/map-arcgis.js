/*---------------------------------------------↓Map-----------------------------------------------*/
var mapSearchURL = "api/mapSearch",
    basemapURL = 'http://10.10.2.81:6080/arcgis/rest/services/China_Community_BaseMap/MapServer',
//countryLayerURL = 'http://10.10.2.81:6080/arcgis/rest/services/testprovince1/FeatureServer/2',
    countryLayerURL = 'http://10.10.2.81:6080/arcgis/rest/services/world/MapServer/0',
    provinceLayerURL = 'http://10.10.2.81:6080/arcgis/rest/services/testprovince1/FeatureServer/1',
//    cityLayerURL = 'http://10.10.2.81:6080/arcgis/rest/services/testprovince1/FeatureServer/0';
    cityLayerURL = 'http://10.10.2.81:6080/arcgis/rest/services/area/MapServer/1';
var MAP_PAGE_SIZE = 5;
var countryGL, cityGL, map, countryFS = {}, provinceFS = {}, cityFS = {}, featureGL, deviceGL, countryLayer, provinceLayer, cityLayer;
var clusterLayer, featureLayer;
function initMap() { //网站加载时调用此方法
    //listener
    $('.sidebarCtrl').on('click', function (e) {
        e.preventDefault();
        $('#mapSidebar').toggleClass('active');
    });
    $('.map-sidebar-link')
        .on('click', function (e) {
            e.preventDefault();
            $('#mapSidebar').toggleClass('active')
        })
        .on('hover', function (e) {
            e.preventDefault();
            $('#mapSidebar').addClass('onHover');
        });

    require(
        [
            "esri/map",
            "esri/layers/ArcGISTiledMapServiceLayer",
            "esri/layers/GraphicsLayer",
            "esri/InfoTemplate",
            "esri/layers/FeatureLayer",
            "esri/dijit/HomeButton",
            "esri/dijit/Legend",
            "dojo/domReady!"
        ],
        function (Map, ArcGISTiledMapServiceLayer, GraphicsLayer, InfoTemplate, FeatureLayer, HomeButton, Legend) {
            //（1）Create map and add layer
            map = new Map("mapHolder", {
                //basemap: 'gray',
                center: [114.25, 24.1167],
                minZoom: 3,
                maxZoom: 8,
                zoom: 4,
                sliderPosition: "bottom-right",
                logo: false
            });
            //（1）添加底图
            var basemap = new ArcGISTiledMapServiceLayer(basemapURL);
            map.addLayer(basemap);

            //（2）添加用于显示分布图的graphic layer
            var featureLayerInfoTemplate = new InfoTemplate("${Name_CHN}", "国家：<b>${Name_CHN}<b><br>共发现目标：<b>${count}</b>个");
            featureLayer = new GraphicsLayer(featureLayerInfoTemplate);
            /* var legend = new Legend({
             map: map,
             layerInfos: [{layer: featureLayer}]
             }, "legend");
             legend.startup();
             */
            map.addLayer(featureLayer);

            map.on('load', function () {
                console.log("map loaded");
                //（3）添加城市featureLayer
                cityLayer = new FeatureLayer(cityLayerURL, {
                    outFields: ["*"]
                });
                cityLayer.setMaxAllowableOffset(map.extent.getWidth() / map.width);
                map.addLayer(cityLayer);

                //（4）监听tool bar
                $('.map-layer a').on('click', function (e) {
                    e.preventDefault();
                    var $this = $(this);
                    console.log(this);
                    console.log($this);
                    $this.toggleClass('open');
                    if ($this.hasClass('open')) {
                        $('.map-layer a').removeClass('open').find('span').removeClass('glyphicon-eye-open');
                        $this.addClass('open').find('span').addClass('glyphicon-eye-open');
                        MyFeatureLayer.show($this.attr('id'));
                    } else {
                        MyFeatureLayer.hide();
                        $this.removeClass('open').find('span').removeClass('glyphicon-eye-open');
                    }
                });
            });

            map.on('zoom-end', function (e) {
                console.log("zoom levle: " + map.getZoom());
                MyMap.search(true, 1);
                if ($('#city').hasClass('open')) {
                    MyFeatureLayer.show('city');
                }
            });

            map.on('pan-end', function (e) {
                console.log("paning: " + map.getZoom());
                //MyMap.search(false, 1);
            });
        });
}

var MyFeatureLayer = {
    show: function (which) {
        console.log('show feature layer');
        var dd = MySessionStorage.get('data');
        if (dd && !isEmptyObject(dd) && dd['aggregation']) {
            map.removeLayer(featureLayer);
            featureLayer.clear();
            switch (which) {
                case 'country':
                    showCountry(dd['aggregation']);
                    break;
                case 'province':
                    showProvince(dd['aggregation']);
                    break;
                case 'city':
                    showCityFromArcGis(dd['aggregation']);
                    break;
            }
        } else {
            MyMap.showNoData();
        }

        function showCountry(agg) {
            //console.log("country is rendering, agg=", agg);
            if (!agg || isEmptyObject(agg)) return;
            //console.log("country is rendering ---------countries==", agg['country@%city']);
            if (!agg['country@%city'] || isEmptyObject(agg['country@%city']))return;
            console.log("country is rendering -----------++++++++++", countryFS);

            if (countryFS && countryFS.features && !isEmptyObject(countryFS.features)) {
                render(agg['country@%city'], countryFS.features);
            } else {
                console.log("country layer is not loaded yet. wait...");
                var wait = setInterval(function () {
                    if (countryFS && countryFS.features && !isEmptyObject(countryFS.features)) {
                        render(agg['country@%city'], countryFS.features);
                    }
                }, 1000);
            }
            function render(countries, features) {
                console.log("countryLayer is rendering...");
                var min = Number.MAX_VALUE, max = 0;
                require(["esri/graphic"], function (Graphic) {
                    for (var key in countries) {
                        var country = countries[key];
                        if (country.en && features.hasOwnProperty(country.en)) {
                            var g = features[country.en];
                            g.attributes.count = country.count;
                            g.attributes.Name_CHN = key;
                            featureLayer.add(new Graphic(g));
                            setMinMax(country.count);
                        }
                    }
                    renderFeatureLayer(featureLayer, min, max);
                });
                function setMinMax(count) {
                    if (count < min) {
                        min = count;
                    }
                    if (count > max) {
                        max = count;
                    }
                }
            }
        }

        function showProvince(agg) {
            console.log("province is rendering ...");
            if (!agg || isEmptyObject(agg)) return;
            //console.log("province is rendering ---------provinces==", agg['province']);
            if (!agg['province'] || isEmptyObject(agg['province']))return;
            //console.log("province is rendering -----------++++++++++", provinceFS);
            if (provinceFS && provinceFS.features && !isEmptyObject(provinceFS.features)) {
                render(agg['province'], provinceFS.features);
            } else {
                console.log("province layer is not loaded yet. wait...");
                var wait = setInterval(function () {
                    if (provinceFS && provinceFS.features && !isEmptyObject(provinceFS.features)) {
                        render(agg['province'], provinceFS.features);
                    }
                }, 1000);
            }
            function render(provinces, features) {
                var min = Number.MAX_VALUE, max = 0;
                require(["esri/graphic"], function (Graphic) {
                    /*map.removeLayer(featureLayer);
                     featureLayer.clear();*/
                    for (var key in features) {
                        if (provinces.hasOwnProperty(key)) {
                            console.log('in if');
                            var g = features[key];
                            var count = provinces[key];
                            g.attributes.count = count;
                            featureLayer.add(new Graphic(g));
                            setMinMax(count);
                        }
                    }
                    renderFeatureLayer(featureLayer, min, max);
                });
                function setMinMax(count) {
                    if (count < min) {
                        min = count;
                    }
                    if (count > max) {
                        max = count;
                    }
                }
            }
        }

        function showCityFromArcGis(agg) {
            console.log("city is rendering ...");
            if (!agg || isEmptyObject(agg)) return;
            if (!agg['country@%city'] || isEmptyObject(agg['country@%city']))return;
            //console.log("city is rendering -----------++++++++++", cityLayer.graphics);
            var countries = agg['country@%city'], cities = {};
            for (var co in countries) {
                var country = countries[co];
                if (co == '中国' || country.en == 'China') {
                    cities = country['cities'];
                    break;
                }
            }

            if (cityLayer && cityLayer.graphics && cityLayer.graphics.length > 0) {
                render(cities, cityLayer.graphics);
            } else {
                console.log("city layer is not loaded yet. wait...");
                var wait = setInterval(function () {
                    if (cityLayer && cityLayer.graphics && cityLayer.graphics.length > 0) {
                        render(cities, cityLayer.graphics);
                    }
                }, 1000);
            }

            function render(cities, features) {
                console.log("cityLayer rendering ...", features);
                var min = Number.MAX_VALUE, max = 0;
                /*map.removeLayer(featureLayer);
                 featureLayer.clear();*/
                for (var key in cities) {
                    for (var i = 0; i < features.length; i++) {
                        if (features[i].attributes['Name_CHN'].indexOf(key) >= 0) {
                            var count = cities[key];
                            var g = features[i];
                            g.attributes.count = count;
                            featureLayer.add(g);
                            setMinMax(count);
                        }
                    }
                }
                renderFeatureLayer(featureLayer, 0, max);
                function setMinMax(count) {
                    if (count < min) {
                        min = count;
                    }
                    if (count > max) {
                        max = count;
                    }
                }
            }
        }

        function renderFeatureLayer(layer, min, max) {
            require([
                "esri/graphic",
                "esri/renderers/SimpleRenderer", "esri/Color",
                "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol",
                "esri/dijit/Legend"
            ], function (Graphic, SimpleRenderer, Color, SimpleFillSymbol, SimpleLineSymbol, Legend) {
                /*if ('' + max.length - 3 > '' + min.length) {
                 min=min
                 }*/
                //featureLayer.clear();
                var sfs = new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.1).setColor(new Color([128, 128, 128])));
                var renderer = new SimpleRenderer(sfs);
                renderer.setColorInfo({
                    field: "count",
                    minDataValue: min,
                    maxDataValue: max,
                    colors: [
                        //new Color([244, 238, 246, 0]),
                        new Color([221, 200, 225, 0.75]),
                        //new Color([244, 238, 246, 0.7]),
                        new Color([121, 37, 135, 0.7])
                    ]
                });
                layer.setRenderer(renderer);
                map.addLayer(layer, 3);
                layer.show();
                map.reorderLayer(clusterLayer, 100);
            });
        }
    },
    hide: function () {
        featureLayer.clear();
        //cityLayer.hide();
    }
};
var MyMap = {
    RENDER_ZOOM: 4,
    show: function () { //滑动到地图页时调用此方法
        $('header').css('visibility', ' visible').show();
        MySessionStorage.set('currentPage', 'map');
        var data = MySessionStorage.get('data');
        if (data && !isEmptyObject(data)) {
            //（1）显示左侧边栏
            Sidebar.show();
            //（2）渲染地图
            this.render(data);
        } else {
            this.search(true, 1);
        }
    },
    render: function (data) {//向地图添加设备标注
        console.log("map render starts--", data);
        if (!data || isEmptyObject(data)) {
            console.log('in map render data is undefined or empty');
            return;
        }
        this.hideNoData();
        if (map) {
            //（1）添加设备层
            addClusters(data['data']);
            //（2）显示地图右侧边栏
            MapSidebar.init(data);
            MapSidebar.show();
        } else {
            var interval = setInterval(function () {
                if (map) {
                    //（1）添加设备层
                    addClusters(data['data']);
                    //（2）显示地图右侧边栏
                    MapSidebar.init(data);
                    MapSidebar.show();
                    clearInterval(interval);
                }
            }, 1000);
        }

        function addClusters(devices) {
            console.log("add cluster -----", devices);
            if (!devices) {
                return;
            }
            if (clusterLayer) {
                map.removeLayer(clusterLayer);
                clusterLayer.clear();
            }
            require([
                "esri/SpatialReference",
                "esri/dijit/PopupTemplate",
                "esri/geometry/Point",
                "esri/geometry/webMercatorUtils",

                "extras/ClusterLayer",
                "esri/symbols/SimpleLineSymbol",
                "esri/symbols/SimpleMarkerSymbol",
                "esri/symbols/PictureMarkerSymbol",
                "esri/renderers/ClassBreaksRenderer",
                "esri/symbols/SimpleFillSymbol"

            ], function (SpatialReference, PopupTemplate, Point, webMercatorUtils, ClusterLayer,
                         SimpleLineSymbol, SimpleMarkerSymbol, PictureMarkerSymbol, ClassBreaksRenderer) {
                var devicesInfo = {};
                var wgs = new SpatialReference({
                    "wkid": 4326
                });
                devicesInfo.data = $.map(devices, function (d) {
                    var latlng = new Point(parseFloat(d.lon), parseFloat(d.lat), wgs);
                    var webMercator = webMercatorUtils.geographicToWebMercator(latlng);
                    var ports = d.ports, vuls = d.vuls, portsStr = '', vulsStr = '';
                    for (var i = 0; i < ports.length; i++) {
                        for (var p in ports[i]) {
                            portsStr += ', ' + ports[i][p];
                        }
                    }
                    for (var j = 0; j < vuls.length; j++) {
                        for (var key in vuls[j]) {
                            vulsStr += ", " + vuls[j][key];
                        }
                    }

                    var attributes = {
                        "IP": d.ip,
                        "Location": d.location,
                        "Ports": portsStr,
                        "Tags": d.tags,
                        "Vuls": vulsStr,
                        "Timestamp": d.timestamp,
                        "Image": basePath + "resources/img/home.png",
                        "Link": d.link
                    };
                    return {
                        "x": webMercator.x,
                        "y": webMercator.y,
                        "attributes": attributes
                    };
                });

                // popupTemplate to work with attributes specific to this dataset
                var popupTemplate = new PopupTemplate({
                    "title": "",
                    "fieldInfos": [{
                        "fieldName": "Ip",
                        visible: true
                    }, {
                        "fieldName": "Location",
                        "label": "位置：",
                        visible: true
                    }, {
                        "fieldName": "Ports",
                        "label": "服务：",
                        visible: true
                    }, {
                        "fieldName": "Vuls",
                        "label": "漏洞：",
                        visible: true
                    }, {
                        "fieldName": "Tags",
                        "label": "标签：",
                        visible: true
                    }/*, {
                     "fieldName": "Timestamp",
                     "label": "更新时间：",
                     visible: true
                     }*/],
                    "mediaInfos": [{
                        "title": "",
                        "caption": "",
                        "type": "image",
                        "value": {
                            "sourceURL": "{Image}",
                            "linkURL": "{Image}"
                        }
                    }]
                });

                // cluster layer that uses OpenLayers style clustering
                clusterLayer = new ClusterLayer({
                    "data": devicesInfo.data,
                    "distance": 100,
                    "id": "clusters",
                    "labelColor": "#fff",
                    "labelOffset": 10,
                    "resolution": map.extent.getWidth() / map.width,
                    "singleColor": "#888",
                    "singleTemplate": popupTemplate
                });
                var defaultSym = new SimpleMarkerSymbol().setSize(4);
                var renderer = new ClassBreaksRenderer(defaultSym, "clusterCount");

                var green = new PictureMarkerSymbol(imgUrl + "green.png", 64, 64).setOffset(0, 15);
                var red = new PictureMarkerSymbol(imgUrl + "red.png", 72, 72).setOffset(0, 15);
                renderer.addBreak(0, 200, green);
                renderer.addBreak(200, 1001, red);

                clusterLayer.setRenderer(renderer);
                map.addLayer(clusterLayer);
                clusterLayer.redraw();

                clusterLayer.on('click', function (e) {
                    console.log("cluster layer's feature is clicked");
                    e.preventDefault();
                });

                /*// close the info window when the map is clicked
                 map.on("click", cleanUp);*/

                // close the info window when esc is pressed
                map.on("key-down", function (e) {
                    if (e.keyCode === 27) {
                        cleanUp();
                    }
                });
            });
        }

        function cleanUp() {
            map.infoWindow.hide();
            clusterLayer.clearSingles();
        }
    },
    search: function (updateSidebar, page) {//updateSidebar, boolean，true，表示更新sidebar，否则不更新
        console.log("map search function starts--");
        updateSidebar=true;
        var wd = MySessionStorage.get('wd');
        if (wd && wd != '') {
            var extent = getVisibleExtent();//获取并设置屏幕所在范围的经纬度geo
            MySessionStorage.set('mapExtent', extent);

            var criteria = {
                "geo": extent,
                "wd": MySessionStorage.get('mapWd'),
                "zoomlevel": map.getZoom(),
                "pagesize": MAP_PAGE_SIZE,
                "page": page
            };
            var success = function (data) {
                console.log("map search succeed", data);
                if (updateSidebar) {
                    Sidebar.init(data['aggregation']);
                    Sidebar.show();
                }
                MySessionStorage.set('mapWd', data['q']);
                MySessionStorage.set('lastSavedWd', 'map');
                MyMap.render(data);
            };
            var noDataFunc = this.showNoData;
            var searchObj = {
                "url": basePath + mapSearchURL,
                "success": success,
                //"noDataFunc": noDataFunc,
                "criteria": criteria
            };
            newSearch(searchObj);

            //获取地图的可视范围的经纬度
            function getVisibleExtent() {
                var polygonCCW = '';
                require([
                    "esri/geometry/ScreenPoint",
                    "esri/geometry/webMercatorUtils"
                ], function (ScreenPoint, webMercatorUtils) {
                    var windowHeight = $(window).height(), windowWidth = $(window).width();
                    var sLeftTop = new ScreenPoint(0, 0),
                        sRightBottom = new ScreenPoint(windowWidth, windowHeight);
                    var mLeftTop = webMercatorUtils.webMercatorToGeographic(map.toMap(sLeftTop)),
                        mRightBottom = webMercatorUtils.webMercatorToGeographic(map.toMap(sRightBottom));
                    /* var mLeftTop = map.toMap(sLeftTop),
                     mRightBottom = map.toMap(sRightBottom);*/

                    var xL = mLeftTop.x, xR = mRightBottom.x, yT = mLeftTop.y, yB = mRightBottom.y;
                    //逆时针，4个点，首尾闭合
                    polygonCCW = 'polygon(' +
                    xL + ' ' + yT + ',' +             //左上
                    xL + ' ' + yB + ',' +             //左下
                    xR + ' ' + yB + ',' +             //右下
                    xR + ' ' + yT + ',' +             //右上
                    xL + ' ' + yT + ')';              //首尾闭合
                });
                return polygonCCW;
            }
        }
    },
    showNoData: function () {
        console.log("no data");
        //MySessionStorage.set('currentPage', 'home');
    },
    hideNoData: function () {
        console.log("hide data function");
    }
};

var MapSidebar = {
    show: function () {
        $('#mapSidebar').show();
    },
    init: function (data) {
        //popup_sidepanel， ArcGis 自带的侧边栏
        var devices = data['data'];
        console.log("init map sidebar", devices);

        $('#mapSidebar a').on('click', function (e) {
            e.preventDefault();
            console.log($(this).closeset('li').attr('id'));
        });
        //添加设备
        var deviceList = $('.map-device-list').html('');
        $.each(devices, function (index, d) {
            //console.log(d);
            addDevices(d);
        });
        //分页
        var total = data['total'] ? data['total'] : 0;
        //this.paginator(total, data['pagesize'], data['currentpage']);

        //添加设备，待补充
        function addDevices(device) {
            var $li = $('<li id="' + device.ip + '"></li>').appendTo($('.map-device-list'));
            var $title = $('<a href="#" class="title">' + device.ip + '</a>').appendTo($li);
            var $info = $('<div class="info"></div>').appendTo($li);
            var loc = device.location, time = device.timestamp, tags = device.tags, ports = device.ports, vuls = device.vuls;
            if (loc && loc != '') {
                $info.append($('<span class="label label-default location">' + loc + '</span>'));
            }
            //if (time && time != '') {
            //    $info.append($('<span class="label label-default timestamp">' + dateLocalize(time) + '</span>'));
            //}
            if (tags && tags != '') {
                $info.append($('<span class="label label-default tags">' + tags + '</span>'));
            }

            if (ports && ports != '' & ports.length > 0) {
                for (var i = 0; i < ports.length; i++) {
                    for (var key in ports[i]) {
                        $info.append($('<span class="label label-default port">' + key + '</span>'));
                    }
                }
            }
            if (vuls && vuls != '') {
                for (var key in vuls) {
                    $info.append($('<span class="label label-default vul">' + key + '</span>'));

                }
            }
        }
    },
    onSelectionChange: function () {    //用户选择了一个设备的时候，在地图上弹出对应设备的infowindow
        var selected = map.infoWindow.getSelectedFeature();
        console.log("on selection  change, selected = ", selected);
    },
    paginator: function (totalCounts, pageSize, currentPageNum) {
        if (!totalCounts || totalCounts == undefined) {
            totalCounts = 0;
        }
        $("#map_pager").jqPaginator({
            totalPages: totalCounts,
            visiblePages: 1,
            currentPage: currentPageNum,
            prev: '<li class="prev"><a href="javascript:void(0);">上一页<\/a><\/li>',
            next: '<li class="next"><a href="javascript:void(0);">下一页<\/a><\/li>',
            page: '<li class="page"><a href="javascript:void(0);"> {{page}} / {{totalPages}} <\/a><\/li>',
            onPageChange: function (n) {
                //$("#demo4-text").html("当前第" + n + "页");
                if (type == 'change') {
                    var currPage = MySessionStorage.get('currentPage');
                    if (currPage == 'list') {
                        List.search(false, num);
                    } else if (currPage == 'map') {
                        MyMap.search(false, num);
                    }
                }
            }
        });
    }
};

//------------------------------↓ functions not in use currently-------------------
function addDeviceGraphicLayer(devices) {
    if (!devices)return;
    require([
        "esri/symbols/PictureMarkerSymbol",
        "esri/graphic",
        "esri/geometry/Point",
        "esri/symbols/SimpleLineSymbol",
        "esri/renderers/SimpleRenderer"
    ], function (PictureMarkerSymbol, Graphic, Point) {
        console.log("add device graphic layer=========");
        deviceGL.clear();
        var pms = new PictureMarkerSymbol(imgUrl + "red.png", 40, 40).setOffset(0, 15);
        devices.forEach(function (d) {
            var attr = {
                "ip": d.ip,
                "location": d.location,
                "tags": d.tags,
                "ports": d.ports.map(function (port) {
                    var result;
                    for (var key in port) {
                        result += key;
                    }
                    return result;
                }),
                "vuls": d.ports.map(function (vul) {
                    var result;
                    for (var key in vul) {
                        result += key;
                    }
                    return result;
                }),
                "timestamp": dateLocalize()
            };
            var pt = new Point(d.lon, d.lat, map.spatialReference);
            //console.log("lng-- " + d.lon, "lat-- " + d.lat);
            var gc = new Graphic(pt, pms, attr);
            //console.log(gc);
            deviceGL.add(gc);//（1）添加到graphics层
        });
    });
}

initMap();