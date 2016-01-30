/*---------------------------------------------↓List-----------------------------------------------*/
var listSearchURL = basePath + 'api/listSearch';
var PAGE_SIZE = 10, //每一页的条目数
    VISIBLE_PAGES = 7; //页码个数

var List = {
    tag: 'list',
    listPageNum: 1,
    wrapper: $('.result-col'),
    show: function (data) {
        MySessionStorage.set('currentPage', this.tag);
        $('header').css('visibility', ' visible').show();
        if (data && data['statuscode'] == 200) {
            this.render(data);
            this.wrapper.show();
            Sidebar.show(data['aggregation']);
        } else {
            this.search(this.listPageNum);
        }
        this.wrapper.show();
    },
    hide: function () {
        this.wrapper.hide();
    },
    render: function (data) {
        console.log("list is rendering---", data);
        //更新查询时间、查询到数据的条数、结果列表、分页
        var currpage = data['currpage'],
            total = data['total'],
            pagesize = data['pagesize'],
            took = data['took'];
        //时间
        $('.duration').text(took);
        //条数
        $('.resultCount').text(total);
        $('#pageTip').html(currpage + '/' + (Math.floor(total / pagesize) + 1));
        //结果列表
        var list = $('.result-container ul.devices').html('');
        var devices = data['data'];
        for (var i = 0; i < devices.length; i++) {
            list.append(genDeviceLi(devices[i]));
        }
        list.append('<div class="clearfix"></div>');
        //分页
        paginator(total, pagesize, currpage, VISIBLE_PAGES);
        //----------------------functions ↓---------------------
        function genDeviceLi(d) {
            //console.log("genDeviceLi", d);
            var li = $(' <li class="device"></li>');
            //ip
            var ip = $('<h3><a href="#' + d.ip + d.ip + '"></a></h3>').appendTo(li);
            //详细内容
            var row = $('<div class="row"></div>').appendTo(li);
            //all tags
            //tag
            var facets = $(' <div class="col-md-3 col-sm-3 left"></div>').appendTo(row);
            if (d.hasOwnProperty('tags') && d.tags != '' && d.tags.length > 0) {
                var $tags = $('<div class="tag"></div>').appendTo(facets);
                d.tags.forEach(function (tag) {
                    $('<span class="label label-default"><a href="#' + tag + '"> ' + tag + ' </a></span>').appendTo($tags);
                });
            }
            //location
            var loc = d.location;
            if (loc && loc != '') {
                var $location = $('<div class="tag location"></div>').appendTo(facets);
                $('<span class="label label-danger"><a href="#' + loc + '">' +
                '<span class="glyphicon glyphicon-map-marker"></span> ' + loc + ' </a></span>').appendTo($location);
            }
            //time
            /* var time = d.timestamp;
             if (time && time != '') {
             var $time = $('<div class="tag time"></div>').appendTo(facets);
             $('<span class="label label-primary"><a href="#' + time + '">' +
             '<span class="glyphicon glyphicon-time"></span> ' + time + ' </a></span>').appendTo($time);
             }*/
            facets.find('a').on('click', function (e) {
                e.preventDefault();
            });

            //ports and vuls
            var info = $('<div class="col-md-9 col-sm-9 right"></div>').appendTo(row);
            var ports = d.ports;
            if (ports != '' && ports.length > 0) {
                for (var i = 0; i < ports.length; i++) {
                    for (var key in ports[i]) {
                        var $port = $('<article><h3><a href="#">' + key + '</a></article>').appendTo(info);
                        var banner = ports[i][key];
                        if (banner || banner == '') {
                            banner = banner.replace(/</g, "&lt;");
                        }
                        var $pre = $('<pre>' + banner + '</pre>').appendTo($port);

                        $pre.on('click', function () {
                            if (!info.hasClass('active')) {
                                $(this).closest('div.right').addClass('active');
                            }
                        });
                    }
                }
            }
            var vuls = d.vuls;

            if (vuls != '' && vuls.length > 0) {
                for (var key in vuls) {
                    var $vul = $('<article><h3><a href="#">' + key + '</a></article>').appendTo(info);
                    $('<pre>' + vuls[key] + '</pre>').appendTo($vul);
                }
            }
            var closeBtn = $('<button class="up"><span class="glyphicon glyphicon-menu-up"></span></button>').appendTo(info);
            closeBtn.on('click', function () {
                $(this).closest('div.right').removeClass('active');
            });
            return li;
        }

        /*
         * @param totalCounts：分页的总条目数
         * @param pageSize：每一页的条目数
         * @param currentPage：当前页码
         * @param visiblePages: 最多显示的页码数，默认值7
         */
        function paginator(totalCounts, pageSize, currentPageNum, visiblePages) {
            if (visiblePages == undefined) {
                visiblePages = VISIBLE_PAGES;
            }
            if (pageSize == undefined) {
                pageSize = PAGE_SIZE;
            }
            if (!totalCounts || totalCounts == undefined) {
                totalCounts = 0;
            }
            var $pagerWrapper = $('#pager').show();
            $pagerWrapper.jqPaginator({
                totalCounts: totalCounts,
                pageSize: pageSize,
                visiblePages: visiblePages,
                currentPage: currentPageNum,
                first: '<li class="first"><a href="javascript:void(0);">首页</a></li>',
                prev: '<li class="prev"><a href="javascript:void(0);"><i class="glyphicon glyphicon-triangle-left"></i>上一页</a></li>',
                next: '<li class="next"><a href="javascript:void(0);">下一页<i class="glyphicon glyphicon-triangle-right"></i></a></li>',
                last: '<li class="last"><a href="javascript:void(0);">末页<\/a></li>',
                page: '<li class="page"><a href="javascript:void(0);">{{page}}</a></li>',
                //设置页码的Html结构,其中可以使用{{page}}代表当前页，{{totalPages}}代表总页数，{{totalCounts}}代表总条目数
                onPageChange: function (num, type) { //num: 目标页；type:“init”（初始化），“change”（点击分页）
                    if (type == 'change') {
                        //console.log('{{page}}');
                        //console.log(num + ", " + type);
                        //searchViaAjax(URL, $('#wd').val(), num);
                        this.listPageNum = num;
                        this.search(num);
                    }
                }
            })
        }
    },
    search: function (pageNumber) {  //updateSidebar为boolean，true则更新侧边栏，否则不更新
        console.log("List search starts ----wd before search" + MySessionStorage.get('wd'));
        var wd = MySessionStorage.get('wd') ? MySessionStorage.get('wd') : $('.global-search-input').val();
        var checkedStr = MySessionStorage.getCheckedAsStr();
        if (wd && wd != '') {
            var obj = {
                "url": listSearchURL,
                "criteria": {
                    "wd": wd + checkedStr,
                    "page": pageNumber ? pageNumber : this.listPageNum
                }
            };
            newSearch(obj);
        }
    },
    showNoData: function () {
        $('.empty-result-desc-container').show();
        this.wrapper.hide();
    },
    hideNoData: function () {
        $('.empty-result-desc-container').hide();
        this.wrapper.show();
    }
};

/*
 var List = {
 show: function () {
 MySessionStorage.set('currentPage', 'list');
 $('header').css('visibility', ' visible').show();
 var data = MySessionStorage.get('data');
 if (data == undefined || data == '') {
 this.search(true, 1);
 } else {
 this.render(data);
 }
 },
 render: function (data) {
 console.log("list is rendering---", data);
 if (isEmptyObject(data)) {
 console.log("data is null");
 this.showNoData();
 return;
 }
 this.hideNoData();
 Sidebar.show(); //显示侧栏
 Sidebar.ini
 //更新查询时间、查询到数据的条数、结果列表、分页、侧栏checked
 $('.duration').text(data['took']);   //时间
 var total = data['total'] ? data['total'] : 0;
 $('.resultCount').text(total);   //条数
 //正文 result list显示
 var list = $('.result-container ul.devices').html('');
 var devices = data.data;
 for (var i = 0; i < devices.length; i++) {
 list.append(genDeviceLi(devices[i]));
 }
 list.append('<div class="clearfix"></div>');

 //分页
 paginator(total, data['pagesize'], data['currpage'], VISIBLE_PAGE);

 function genDeviceLi(d) {
 //console.log("genDeviceLi", d);
 var li = $(' <li class="device"></li>');
 //ip
 var ip = $('<h3><a href="#' + d.ip + d.ip + '"></a></h3>').appendTo(li);
 //详细内容
 var row = $('<div class="row"></div>').appendTo(li);
 //all tags
 //tag
 var facets = $(' <div class="col-md-3 col-sm-3 left"></div>').appendTo(row);
 if (d.hasOwnProperty('tags') && d.tags != '' && d.tags.length > 0) {
 var $tags = $('<div class="tag"></div>').appendTo(facets);
 d.tags.forEach(function (tag) {
 $('<span class="label label-default"><a href="#' + tag + '"> ' + tag + ' </a></span>').appendTo($tags);
 });
 }
 //location
 var loc = d.location;
 if (loc && loc != '') {
 var $location = $('<div class="tag location"></div>').appendTo(facets);
 $('<span class="label label-danger"><a href="#' + loc + '">' +
 '<span class="glyphicon glyphicon-map-marker"></span> ' + loc + ' </a></span>').appendTo($location);
 }
 //time
 */
/* var time = d.timestamp;
 if (time && time != '') {
 var $time = $('<div class="tag time"></div>').appendTo(facets);
 $('<span class="label label-primary"><a href="#' + time + '">' +
 '<span class="glyphicon glyphicon-time"></span> ' + time + ' </a></span>').appendTo($time);
 }*//*

 facets.find('a').on('click', function (e) {
 e.preventDefault();
 });

 //ports and vuls
 var info = $('<div class="col-md-9 col-sm-9 right"></div>').appendTo(row);
 var ports = d.ports;
 if (ports != '' && ports.length > 0) {
 for (var i = 0; i < ports.length; i++) {
 for (var key in ports[i]) {
 var $port = $('<article><h3><a href="#">' + key + '</a></article>').appendTo(info);
 var banner = ports[i][key];
 if (banner || banner == '') {
 banner = banner.replace(/</g, "&lt;");
 }
 var $pre = $('<pre>' + banner + '</pre>').appendTo($port);

 $pre.on('click', function () {
 if (!info.hasClass('active')) {
 $(this).closest('div.right').addClass('active');
 }
 });
 }
 }
 }
 var vuls = d.vuls;

 if (vuls != '' && vuls.length > 0) {
 for (var key in vuls) {
 var $vul = $('<article><h3><a href="#">' + key + '</a></article>').appendTo(info);
 $('<pre>' + vuls[key] + '</pre>').appendTo($vul);
 }
 }
 var closeBtn = $('<button class="up"><span class="glyphicon glyphicon-menu-up"></span></button>').appendTo(info);
 closeBtn.on('click', function () {
 $(this).closest('div.right').removeClass('active');
 });
 return li;
 }
 },
 search: function (updateSidebar, pageNumber) {  //updateSidebar为boolean，true则更新侧边栏，否则不更新
 console.log("List search starts ----wd before search" + MySessionStorage.get('wd'));
 var wd = MySessionStorage.get('wd');
 if (wd && wd != '') {
 var success = function (data) {
 if (updateSidebar) {
 Sidebar.init(data['aggregation']);
 }
 var wd = data['wd'];
 MySessionStorage.set('wd', wd);
 MySessionStorage.set('lastSavedWd', 'list');
 List.render(data);
 },
 noDataFunc = List.showNoData;
 var obj = {
 "url": listSearchURL,
 "criteria": {
 "wd": wd,
 "page": pageNumber
 },
 "success": success
 //"noDataFunc": noDataFunc
 };
 newSearch(obj);
 }
 },
 showNoData: function () {
 $('.empty-result-desc-container').show();
 $('.result-col').hide();
 MySessionStorage.set('currentPage', 'home');
 },
 hideNoData: function () {
 $('.empty-result-desc-container').hide();
 $('.result-col').show();
 }
 };*/
