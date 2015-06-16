/**
 * Created by YANGCHENG897 on 2015-06-16.
 */
(function(angular){
    var isQuirk = (document.documentMode) ? (document.documentMode == 5) ? true : false : ((document.compatMode == "CSS1Compat") ? false : true);
    var isElement = function(el) {
        return !!(el && el.nodeType == 1);
    }
    var propCache = [];
    var propFloat = ! + "\v1" ? "styleFloat" : "cssFloat";
    var camelize = function(attr){
        return attr.replace(/\-(\w)/g, function(all, letter){
            return letter.toUpperCase();
        });
    }
    var memorize = function(prop) { //意思为：check out form cache
        return propCache[prop] || (propCache[prop] = prop == "float" ? propFloat : camelize(prop));
    }
    var getIEOpacity = function(el){
        var filter;
        if(!!window.XDomainRequest){
            filter = el.currentStyle.filter.match(/progid:DXImageTransform.Microsoft.Alpha\(.?opacity=(.*).?\)/i);
        }else{
            filter = el.currentStyle.filter.match(/alpha\(opacity=(.*)\)/i);
        }
        if(filter){
            var value = parseFloat(filter[1]);
            if (!isNaN(value)) {
                return value ? value / 100 : 0;
            }
        }
        return 1;
    }
    var convertPixelValue = function(el, value){
        var style = el.style, left = style.left, rsLeft = el.runtimeStyle.left;
        el.runtimeStyle.left = el.currentStyle.left;
        style.left = value || 0;
        var px = style.pixelLeft;
        style.left = left;
        el.runtimeStyle.left = rsLeft;
        return px + "px"
    }

    var rgb2hex = function(rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        return '#' + tohex(rgb[1])+tohex(rgb[2])+tohex(rgb[3])
    }

    var tohex = function(x) {
        var hexDigits = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
        return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
    }
    var getStyle = function (el, style){
        var value;
        if(! + "\v1"){
            if(style == "opacity"){
                return getIEOpacity(el)
            }
            value = el.currentStyle[memorize(style)];
            if (/^(height|width)$/.test(style)){
                var values = (style == "width") ? ["left", "right"] : ["top", "bottom"], size = 0;
                if(isQuirk){
                    return el[camelize("offset-" + style)] + "px"
                }else{
                    var client = parseFloat(el[camelize("client-" + style)]),
                        paddingA = parseFloat(getStyle(el, "padding-" + values[0])),
                        paddingB = parseFloat(getStyle(el, "padding-" + values[1]));
                    return (client - paddingA - paddingB) + "px";
                }
            }
        }else{
            if(style == "float"){
                style = propFloat;
            }
            value = document.defaultView.getComputedStyle(el, null).getPropertyValue(style)
        }
        if(!/^\d+px$/.test(value)){
            if(/(em|pt|mm|cm|pc|in|ex|rem|vw|vh|vm|ch|gr)$/.test(value)){
                return convertPixelValue(el, value);
            }
            if(/%$/.test(value) && style != "font-size"){
                return parseFloat(getStyle(el.parentNode, "width")) * parseFloat(value) /100 + "px"
            }
            if(/^(border).+(width)$/.test(style)){
                var s = style.replace("width", "style"),
                    b  = {
                        thin:["1px", "2px"],
                        medium:["3px", "4px"],
                        thick:["5px", "6px"]
                    };
                if(value == "medium" && getStyle(el, s) == "none"){
                    return "0px";
                }
                return !!window.XDomainRequest ? b[value][0] : b[value][1];
            }
            if(/^(margin).+/.test(style) && value == "auto"){
                var father = el.parentNode;
                if(/MSIE 6/.test(navigator.userAgent) && getStyle(father,"text-align") == "center"){
                    var fatherWidth = parseFloat(getStyle(father,"width")),
                        _temp = getStyle(father,"position");
                    father.runtimeStyle.postion = "relative";
                    var offsetWidth = el.offsetWidth;
                    father.runtimeStyle.postion = _temp;
                    return (fatherWidth - offsetWidth)/2 + "px";
                }
                return "0px";
            }
            if(/(top|left|right|bottom)/.test(style) && value == "auto"){
                return el.getBoundingClientRect()[style];
            }
            if(style.search(/background|color/) != -1) {
                var color = {
                    aqua: "#0ff",
                    black: "#000",
                    blue: "#00f",
                    gray: "#808080",
                    purple: "#800080",
                    fuchsia: "#f0f",
                    green: "#008000",
                    lime: "#0f0",
                    maroon: "#800000",
                    navy: "#000080",
                    olive: "#808000",
                    orange: "#ffa500",
                    red: "#f00",
                    silver: "#c0c0c0",
                    teal: "#008080",
                    transparent: "rgba(0,0,0,0)",
                    white: "#fff",
                    yellow: "#ff0"
                }
                if(!!color[value]){
                    value = color[value]
                }
                if(value == "inherit"){
                    return getStyle(el.parentNode, style);
                }
                if(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.test(value)){
                    return rgb2hex(value)
                }else if(/^#/.test(value)){
                    value = value.replace('#', '');
                    return '#' +  (value.length == 3 ? value.replace(/^(\w)(\w)(\w)$/, "$1$1$2$2$3$3") : value);
                }
                return value;
            }
        }
        return value;
    }

    angular.module("css", []).value("cssTool", {
        getStyle: getStyle
    });
})(angular);