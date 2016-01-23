// global variables --> dom
var $advsWrapper = $('#advs_wrapper'),
    $advsControl = $('.advs-link-main').find('span'),
    $header = $('header'),
    $pivotsContainer = $('.pivot-bar-container').hide(),
    $globalInput = $('.global-search-input');
//分隔符：key_s0s_value（s零s）
var CheckboxId_SEPARATOR = '_s0s_';

// global variables --> static url
var advancedSearchURL = basePath + 'api/advancedSearch',
    imgUrl = basePath + "resources/img/",
    getFeatureSetsURL = basePath + 'api/getFeatureSets';

/* localStorage = {
 'user': '',              //用户信息，包含用户名、密码、级别
 'countryFS': {},         //国家FeatureSet映射表
 'provinceFS': {},        //省份FeatureSet映射表
 'cityFS': {}             //城市FeatureSet映射表
 };*/
/* localStorage = {
 'checkedIds': [],         //用户选中的复选框的id
 'devices': [],         //当前获取到的设备信息
 'aggregation': {}      //当前的聚类信息（即左边栏列表数据）
 };*/
/* ↑---------->>>>>>>>>>>>>>>> Global Variables <<<<<<<<<<<<<<<<< ------------------------------↑ */
$(function () {
    "use strict";
    //Init FeatureSets
    initFeatureSets();

    //input suggestions
    suggestCursorToggle();
    inputSuggest($('.global-search-input'), "api/getSuggestions?search=");

    //carousel
    sessionStorage.currentPage = 'map';
    pageSlide();

    //sidebar
    $('.sidebar').hide();

    /*-------------listeners-----------*/
    //global search form
    $('.global-search-form').on('submit', function (e) {
        console.log(e);
    });
    //advanced search
    //advanced search link
    $('.advs-link').on('click', function (e) {
        e.preventDefault();
        if (!($advsWrapper.hasClass('active'))) {
            $advsWrapper.addClass('active');
            console.log("$advsWrapper", $advsWrapper.prop('id'));
            console.log("$advsWrapper", $advsWrapper.prop('class'));
            console.log("$advsWrapper", $advsWrapper.hasClass('active'));
            //console.log("$advsWrapper",$advsWrapper.class);
            $advsControl.removeClass('glyphicon-menu-right').addClass('glyphicon-menu-left');
            $advsWrapper.show();
        } else {
            $advsWrapper.removeClass('active');
            $advsControl.removeClass('glyphicon-menu-left').addClass('glyphicon-menu-right');
        }
    });
    //advanced search form
    $('#advs').on('submit', function (e) {
        e.preventDefault();
        advsSearch(this);
    });
    //advanced search form controls.close
    $('.close-advs').on('click', function () {
        $advsWrapper.removeClass('active');
    });
    //advanced search form controls.reset
    $('.reset-advs').on('click', function () {
        document.getElementById("advs").reset();
    });
    //advanced search form input for ip
    $('#ip').on('blur', function () {
        //d+.d+.d+.d+，验证ip地址的合法性，预留
    });
    //date default value
    $('#time_to').val(new Date().toDateInputValue());
});

//------------------------------输入框实时提示-------------------------------------//
function inputSuggest(input, sourceURL) {
    var $form = input.closest('form');
    var suggestions = function (dataSource) {
        var bloodHound = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            //Prefetched data is fetched and processed on initialization. If the browser supports local storage,
            // the processed data will be cached there to prevent additional network requests on subsequent page loads.
            prefetch: {
                //url: 'resources/data/countries.json',
                url: dataSource,
                limit: 10,
                //ttl: 10000,//The time (in milliseconds) the prefetched data should be cached in local storage. Defaults to 86400000 (1 day).
                filter: function (resp) {
                    return $.map(resp.data, function (item) {
                        return $.isArray(item) && item.length == 2 ? {
                            title: item[0],
                            desc: item[1],
                            value: item[0]
                        } : {
                            title: item,
                            value: item
                        }
                    })
                }
            },
            remote: {
                url: dataSource + '%QUERY',
                filter: function (resp) {
                    return $.map(resp.data, function (item) {
                        return $.isArray(item) && item.length == 2 ? {
                            title: item[0],
                            desc: item[1],
                            value: item[0]
                        } : {
                            title: item,
                            value: item
                        }
                    })
                },
                wildcard: '%QUERY'
            }
        });
        // Initialize the Bloodhound suggestion engine
        bloodHound.initialize();
        return bloodHound.ttAdapter();
    };
    if (input.length) {
        // Initialize Typeahead with Parameters
        input.typeahead({hint: false, highlight: true, minLength: 1}, {
            display: "value",
            source: suggestions(sourceURL),
            limit: 10,
            templates: {
                suggestion: function (data) {
                    var result = data.title;
                    if (data.desc) {
                        result += '<span class="muted pull-right">' + data.desc + '</span>'
                    }
                    return '<div>' + result + '</div>'
                }
            }
        }).on("typeahead:selected", function (event, suggestion) {
            //console.log("suggestion", suggestion);
            $form.submit()
        }).on("keypress keydown keyup paste change", function () {
        }).filter(".home-search .flex-text").focus()
    }
}

//修复typeahead.js的一个bug，参考：https://github.com/twitter/typeahead.js/issues/1195
function suggestCursorToggle() {
    $('body').on("mouseover", ".tt-suggestion", function () {
        $('.tt-suggestion').removeClass('tt-cursor');
        $(this).addClass('tt-cursor');
    });
}

//------------------------Advanced Search 精确搜索----------------------------------//


function advsSearch(form) {
    var success = function (data) {
            console.log('success', data);
            //generate sidebar
            initSidebar(data.aggregation);
            $advsWrapper.removeClass('active');
        },
        error = function (data) {
            console.log('error', data);
            $advsWrapper.removeClass('active');
        },
        noData = function (data) {
            console.log('nodata', data);
            $advsWrapper.removeClass('active');
        },
        getCriteria = function () {
            var criteria = {}, ipSegment = '', timeSegment = '',
                inputs = $(form).find('fieldset').find('input');

            for (var i = 0; i < inputs.length; i++) {
                var key = inputs[i].id;
                if (key == 'country' || key == 'city' || key == 'port' || key == 'os' || key == 'vul' || key == 'device_service' || key == 'device_type') {
                    setSessionChecked('add', key);
                }

                if (key.indexOf("ip_") >= 0) {
                    ipSegment += $(inputs[i]).val() + '-';
                    continue;
                }

                var timestamp = (Date.parse(new Date($(inputs[i]).val()))) / 1000;
                if (key.indexOf('time_') >= 0) {
                    timeSegment += timestamp + '-';
                    continue;
                }
                criteria[key] = $(inputs[i]).val().replace(/\s+/g, " ");//所有空白符都替换为一个空格
            }
            if (ipSegment != '') {
                criteria['ip'] += ' ' + ipSegment.replace(/^-|-$/g, '');//去掉首尾的“-”和空格
            }
            if (timeSegment != '') {
                timeSegment = timeSegment.replace(/\s+/g, "").replace(/^-|-$/g, '');
                if (timeSegment.indexOf('-NaN') >= 0) {
                    timeSegment = timeSegment.replace('-NaN', '-' + (Date.parse(new Date().toDateInputValue())) / 1000);
                } else if (timeSegment.indexOf('NaN-') >= 0) {
                    timeSegment = timeSegment.replace('NaN-', '');
                }
                criteria['lastModified'] = timeSegment;
            }
            return criteria;
        };

    //arguments
    var obj = {};
    obj["url"] = advancedSearchURL;
    obj['criteria'] = getCriteria();
    obj['success'] = success;
    obj['error'] = error;
    obj['noDataFunc'] = noData;
    obj['searchButton'] = $('.submit-advs');
    console.log("ADVANCE SEARCH ARGUMENT==", obj);
    newSearch(obj);
}


//---------------------------其他------------------------
//页面滑动,使用bootstrap的carousel和slide
function pageSlide() {
    var $carousel = $('.carousel').carousel({"interval": false});
    $carousel.on('slide.bs.carousel', function (event) {
        var tag = $(event.relatedTarget).attr("tag");
        sessionStorage.currentPage = tag;
        var navbtns = $('.navbtn').find('div');
        navbtns.removeClass("bgd-light-blue");
        $.each(navbtns, function (id, item) {
            if ($(item).attr('data-target') == tag) {
                $(item).addClass('bgd-light-blue');
            }
        });
        var progress = $(event.relatedTarget).attr("tabindex") * 120;
        $(".carousel-progress").animate({width: progress, left: (progress / 2) - 400}, 500);
        //playAnimation(tag);
    });
    $("body,html").animate({
        scrollTop: ($(".home").offset().top)
    }, 10);

    //点击切换，起到carousel control的作用
    $('footer .navbtn').on('click', function (e) {
        e.preventDefault();
        var index = $(this).index();
        switch (index) {
            case 0: //home
                onHomePageShow();
                break;
            default:
                $header.show();
        }
        $('.carousel').carousel(index);
    });
}

//首页显示时，隐藏header
function onHomePageShow() {
    $header.hide();
}

//获取所有的featureSet，保存在所有的localStorage中
function initFeatureSets() {
    $.ajax({
        url: getFeatureSetsURL,
        type: 'post'
    }).success(function (data) {
        localStorage.countryFS = data.countryFS;
        localStorage.provinceFS = data.provinceFS;
        localStorage.cityFS = data.cityFS;
    }).error(function () {
        console.log("Getting feature set error!");
    }).fail(function () {
        console.log("Getting feature set failed!");
    });

}

//获取查询的关键词
function getWd() {
    if (!sessionStorage.checked) {
        sessionStorage.checked = {};
    }
    var wd = $globalInput.val(), checked = sessionStorage.checked;
    if (checked) {
        for (var key in checked) {
            wd += key + ':' + checked[key].replace(CheckboxId_SEPARATOR, '');
        }
    }
    return wd;
}

function setSessionChecked(operation, checkedId) {
    var checked = sessionStorage.checked, index = checkedId.indexOf(CheckboxId_SEPARATOR),
        cK = checkedId.substring(0, index), cV = checkedId.substring(index);
    switch (operation) {
        case 'add':
            if (checked[cK] && checked[cK].indexOf(cV) < 0) {
                checked[cK] += ' ' + cV;
            } else {
                checked[cK] = cV;
            }
            break;
        case 'remove':
            checked[cK].replace(cV, '');
            if (checked[cK] == '' || checked[cK].trim() == '') {
                delete checked[cK];
            }
            break;
        default :
            break;
    }
    sessionStorage.checked = checked;
}

/* --------------------------- Helper ------------------------ */
//判断对象是否为空
function isEmptyObject(obj) {
    for (var n in obj) {
        return false
    }
    return true;
}

//Format the date value
Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
});













