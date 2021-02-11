var el = document.createElement('style')
var parsed = {}
/**@type {Object.<string,CSSStyleDeclaration>} */
var style = {}
function parse(obj){
    const el = document.createElement('div')
    for(const attr in obj){
        el.style[attr] = obj[attr]
    }
    return el.style.cssText
}
export function update(){
    var code = ''
    for(const name in parsed){
        code+=`${name}{${parsed[name]}}\n`
    }
    el.textContent = code;
}
export default new Proxy(style,{
    set(t,p,v){
        t[p]= new Proxy(v,{
            set(dec,p2,v2){
                dec[p2] = v2
                parsed[p] = parse(dec)
                return true
            }
        })
        parsed[p] = parse(v)
        return true
    }
})
document.head.append(el)