package com.springapp.mvc.web.config;

/**
 * Created by lyp on 2016-01-22.
 * 保存所有的常亮，使用配置文件配置之前先用此方法存放常亮
 */
public class Constant {
    public static final String suggestionSearchURL = "http://10.10.2.143:8083/se/search/advanced/completionsuggest";
    public static final String advancedSearchURL = "http://10.10.2.143:8083/se/search/advanced?q={q}";
    public static final String mapSearchURL = "http://10.10.2.143:8083/se/search/map?q={q}";
    public static final String listSearchURL = "http://10.10.2.143:8083/se/search?wd={wd}&page={page}";
    public static final String markpointSearchURL = "http://10.10.2.143:8083/se/search/mapcluster?q={q}";
    public static final String marklineSearchURL = "http://10.10.2.84:8082/devicescan/getLinesSegment?numPerPage=100&pageId=";

    public static final String countryFeatureSetURL = "http://10.10.2.81:6080/arcgis/rest/services/world/MapServer/0/query?f=json&where='Shape'='面'&returnGeometry=true&spatialRel=esriSpatialRelIntersects&outFields=NAME,REGION&callback=";
    public static final String provinceFeatureSetURL = "http://10.10.2.81:6080/arcgis/rest/services/sheng/MapServer/0/query?f=json&where='OBJECTID'>'0'&returnGeometry=true&spatialRel=esriSpatialRelIntersects&outFields=*&callback=";
    public static final String cityFeatureSetURL = "http://10.10.2.81:6080/arcgis/rest/services/area/MapServer/1/query?where=OBJECTID+>+1+AND+OBJECTID+<+40&returnGeometry=true&returnIdsOnly=false&returnCountOnly=false&returnZ=false&returnM=false&f=pjson";

    public static final String provinceNameMappingArc_ES = "{\"安徽省\":\"安徽\",\"澳门特别行政区\":\"澳门\",\"北京市\":\"北京\",\"福建省\":\"福建\",\"甘肃省\":\"甘肃\",\"广东省\":\"广东\",\"广西壮族自治区\":\"广西\",\"贵州省\":\"贵州\",\"海南省\":\"海南\",\"河北省\":\"河北\",\"河南省\":\"河南\",\"黑龙江省\":\"黑龙江\",\"湖北省\":\"湖北\",\"湖南省\":\"湖南\",\"吉林省\":\"吉林\",\"江苏省\":\"江苏\",\"江西省\":\"江西\",\"辽宁省\":\"辽宁\",\"内蒙古自治区\":\"内蒙古\",\"宁夏回族自治区\":\"宁夏\",\"青海省\":\"青海\",\"山东省\":\"山东\",\"山西省\":\"山西\",\"陕西省\":\"陕西\",\"上海市\":\"上海\",\"四川省\":\"四川\",\"台湾省\":\"台湾\",\"天津市\":\"天津\",\"西藏自治区\":\"西藏\",\"香港特别行政区\":\"香港\",\"新疆维吾尔自治区\":\"新疆\",\"云南省\":\"云南\",\"浙江省\":\"浙江\",\"重庆市\":\"重庆\"}";
}
