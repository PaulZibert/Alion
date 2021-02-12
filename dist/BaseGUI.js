import Node from "./Node.js"
import css from "./StyleManager.js"
export const Page = new Map()
export const Inline = new Map()
export const Icons = new Map()
export const borderStyle = "solid 2px black"
//#region utils
function config(el,_,props){
    for(const name in props){
        if(name=="class"){
            const cls = props.class
            if(Array.isArray(cls)){
                for(const name of cls){el.classList.add(name)}
            }else{el.classList.add(cls)}
        }else if(name=="style"){
            const style = props.style;
            for(const attr in style){
                el.style[attr] = style[attr]
            }
        }else if(name=="attr"){
            const attrs = props.attr;
            for(const attr in attrs){
                el.setAttribute(attr,attrs[attr])
            }
        }else if(name=="events"){
            const evts = props.events;
            for(const ev in evts){
                el.addEventListener(ev,evts[ev])
            }
        }else{
            el[name] = props[name]
        }
    }
}
function NodeConfig(el,name,props,args){
    if(this instanceof Node){
        if(props.nodeEvents){
            const evts = props.nodeEvents;
            delete props.nodeEvents;
            for(const name in evts){
                this.on(name,el,evts[name])
            }
        }else if(typeof name =="function"){
            this.on('changed',el,()=>{
                el.replaceWith(this.e(name,props,args))
            })
        }
    }
}
/**@param {String} name @returns {HTMLElement}
@param {HTMLElement} props
*/
export function e(name,props={},...args){
    /**@type {HTMLElement} */
    var el;
    if(typeof name == "function"){
        el = name.apply(this,args)
        if(el instanceof Promise){
            const tempEl = e('smpan',{},['loading...'])
            el.then((asyncEl)=>{
                for(const fn of e.configs){
                    fn.apply(this,[asyncEl,name,props,args])
                }
                tempEl.replaceWith(asyncEl)
            })
            return tempEl
        }
        else if(!(el instanceof HTMLElement)){el = e('span',{},[el])}
    }
    else{
        el = typeof name == "string"?document.createElement(name):name
        for(const child of args[0]||[]){
            if(child instanceof Node){
                const inline = child.find(Inline)
                el.append(inline)
            }else{
                el.append(child)
            }
        }
    }
    for(const fn of e.configs){
        fn.apply(this,[el,name,props,args])
    }
    return el
}
e.configs = [NodeConfig,config]
Node.prototype.e = e;
export function vport(els){
    const subEl = Array.isArray(els)?e('div',{},els):els
    return e('div',{class:"v-port"},[subEl])
}
css['.v-port']={position:"relative"}
css['.v-port>div']={position:"absolute",overflow: "auto",top:0,bottom:0,left:0,right:0,}
css['.v-port>div::-webkit-scrollbar']={display:"none"}
export function ico(path){
    return e(vport,{class:"ico-box"},[e('img',{class:"ico",attr:{src:path}})])
}
css['.ico-box'] = {display:"inline",paddingLeft:"1.16em"}
css['.ico'] = {width:"100%",height:"100%"}
//#endregion
//#region mouse Manager
export const MouseNode = new Node('mouseNode')
function MouseView(){
    const el = e('div',{class:"mouse-bufer"})
    function getInline(){
        el.style.display = MouseNode.target?null:"none"
        return MouseNode.target?.find(Inline)
    }
    window.addEventListener('mousemove',function(ev){
        el.style.left = ev.x+10
        el.style.top = ev.y+10
    })
    e(el,{},[MouseNode.e(getInline)])
    return el
}
MouseNode.el = MouseView()
css['.mouse-bufer'] = {
    position:"fixed",
    backgroundColor:"white",
    zIndex:10,
    padding:5,
    border:borderStyle,
    whiteSpace:"nowrap"
}
addEventListener('keydown',(ev)=>{
    const isINPUT = ["INPUT","TEXTAREA"].includes(ev.target.tagName.toUpperCase())
    const isEDITABLE = ev.target.hasAttribute('contenteditable')
    if(isINPUT||isEDITABLE){return}
    if(!MouseNode.target){
        MouseNode.set(new Node('fastCreated',null,""))
    }
    const editableEl = MouseNode.el.querySelector('[contenteditable],input')
    if(editableEl){editableEl.focus()}
})
//#endregion
//#region object
Icons.set(Object,'/icons/object.svg')
function SearchLine(){
    function filter(){
        const name = $inp.value.toLowerCase()
        const list = $inp.parentNode.parentNode.querySelectorAll('.attr')
        for(const el of list){
            const show = !name||el.name.toLowerCase().includes(name)
            el.style.display = show?null:"none"
        }
    }
    const $inp = e('input',{onkeyup:filter,style:{width:"100%",},attr:{placeholder:"Filter/Add"}})
    this.on('changed',$inp,filter)
    const addBtn = e('div',{style:{marginLeft:5},class:"sqr-btn",
        onmouseup:(ev)=>{
            const attr = $inp.value||MouseNode.target?.name
            const val = MouseNode.target?.target
            if(attr){
                MouseNode.set(null)
                this.add(attr,val)
            }
        },
        ondragover(e){e.preventDefault()},
        ondrop:(ev)=>{
            const path = ev.dataTransfer.getData('node')
            if(path){
                const dropNode = Node.fromPath(path)
                const attr = $inp.value||dropNode.name
                const val = dropNode.target
                if(attr){this.add(attr,val)}
            }
        }
    },['+'])
    return e('div',{class:"tool-line"},[
        $inp,
        addBtn
    ])
}
css['.tool-line'] = {display:"flex",marginBottom:5}
css['.tool-line>*'] = {border:borderStyle,fontSize:"1em"}
css['.tool-line>.sqr-btn'] = {width:"1.3em",textAlign:"center"}
function PageObject(){
    const node = this
    const $el = e('div')
    if(!this.target){return "null"}
    // create attrs
    function goToChild(){
        const ev = new CustomEvent('go',{bubbles:true,detail:node.getChild(this.textContent)})
        this.dispatchEvent(ev)
    }
    function getAttr(attr){
        const child = node.getChild(attr)
        const name = e('span',{onclick:goToChild},[attr])
        const icon = e(ico,{
            onclick(ev){
                if(MouseNode.target){
                    node.setChild(attr,MouseNode.target)
                    MouseNode.set(null)
                }
            },
            oncontextmenu(ev){
                ev.preventDefault()
                MouseNode.set(child)
            }
        },child.find(Icons))
        const props = {
            class:"attr",
            name:attr,
            attr:{draggable:true},
            events:{
                dragstart(e){
                    e.dataTransfer.setData('node',child.path)
                },
                drop(e){
                    const path  = e.dataTransfer.getData('node')
                    const dragNode = Node.fromPath(path)
                    node.setChild(attr,dragNode)
                },
                dragover(e){e.preventDefault()}
            }
        }
        return e('div',props,[icon,name,' : ',child])
    }
    /**@type {HTMLElement} */
    var $attrsRoot 
    async function genAttrs(){
        const $attrs = []
        const attrs = await this.getChilds()
        for(const attr of attrs){
            $attrs.push(getAttr(attr))
        }
        $attrsRoot = e('div',{},$attrs)
        return $attrsRoot
    }
    this.on('childChanged',$el,async (name)=>{
        const newEl = await getAttr(name)
        for(const el of $attrsRoot.children){
            if(el.name==name){
                if(newEl){
                    el.replaceWith(newEl)
                }else{
                    $attrsRoot.removeChild(el)
                }
                return
            }
        }
        $attrsRoot.append(newEl)
    })
    this.on('childRemoved',$el,(name)=>{
        for(const el of $attrsRoot.children){
            if(el.name==name){$attrsRoot.removeChild(el)}}
    })
    return e($el,{class:"object-page"},[
        this.e(SearchLine),
        e(vport,{class:'attrs'},this.e(genAttrs))
    ])
    
}
function InlineObject(){
    if(this.target==null){return e('div',{},["null"])}
    return e('span',{},[`Object {${Object.getOwnPropertyNames(this.target).length}}`])
}
css['.object-page'] = {
    height:"100%",
    display:"flex",
    flexDirection:"column",
    boxSizing:"border-box"
}
css['.object-page>.attrs'] = {
    height:"100%",
    border:borderStyle,
}
css['.object-page .attr'] = {
    padding:3,
    borderBottom:borderStyle,
    lineHeight:"25px",
    whiteSpace:"nowrap"
}
css['.object-page .attr>.ico-box'] = {marginRight:3}

Page.set(Object,PageObject)
Inline.set(Object,InlineObject)
//#endregion
//#region string
function InlineString(){
    const node = this
    const onkeyup = function(){
        node.set(this.textContent,this)
    }
    const field = e('span',{onkeyup,attr:{contenteditable:true}},[this.target])
    const nodeEvents = {
        changed(caller){
            if(caller==field)return
            field.textContent = node.target
        }
    }
    return e('span',{},['"',this.e(field,{nodeEvents}),'"'])
}
Page.set(String,function(){
    const node = this
    const nodeEvents = {
        changed(){
            this.value = node.target
        }
    }
    return this.e('textarea',{
        class:"str-inline",
        nodeEvents,
        value:this.target,
        onkeyup(){
            node.set(this.value,this)
        }
    })
})
css['.str-inline'] = {fontSize:"1em"}
Icons.set(String,'/icons/string.svg')
Inline.set(String,InlineString)
//#endregion
//#region number
function InlineNumber(){
    const node = this
    const $ret = e('span')
    const num = e('span',{
        onkeyup(){
            node.set(parseFloat(this.textContent)||0,$ret)
        },
        attr:{contenteditable:true}
    },[`${this.target}`])
    this.on('changed',$ret,(caller)=>{
        if(caller==$ret)return
        num.textContent = `${this.target}`
    })
    function onclick(){
        if(this.textContent=="+"){
            node.set(node.target+1,$ret);
        }else{
            node.set(node.target-1,$ret);
        }
        num.textContent = `${node.target}`
    }
    const plus = e('button',{onclick},['+'])
    const minus = e('button',{onclick},['-'])
    return e($ret,{},[plus,' ',num,' ',minus])
}
Icons.set(Number,'/icons/number.svg')
Inline.set(Number,InlineNumber)
//#endregion
//#region func
function InlineFunc(){
    const node = this
    const btn = e('button',{
        onclick(){
            const caller = node.parent.target
            const result = node.target.apply(caller)
            MouseNode.set(new Node('fnResult',null,result))
        }
    },['r'])
    return e('span',{},[`${this.target.name}(${this.target.length})`,btn])
}
Icons.set(Function,function(){return "/icons/"+(this.target.prototype?"class.svg":"function.svg")})
Inline.set(Function,InlineFunc)
//#endregion
//#region bool
Icons.set(Boolean,'/icons/boolean.svg')
Inline.set(Boolean,function(){
    const node = this
    return this.e('span',{onclick(){
        node.set(!node.target)
        this.textContent = node.target?'🗹':'☐'
        },nodeEvents:{
            changed(){this.textContent = node.target?'🗹':'☐'}
        }},[this.target?'🗹':'☐'])
})
//#endregion
//#region array
Icons.set(Array,'/icons/array.svg')
Inline.set(Array,function(){
    const els = []
    const arr = this.target
    for(const i in arr){
        if(i>4)break;
        els.push(this.getChild(i).find(Inline))
    }
    return e('div',{class:"arr-inline"},els)
})
css['.arr-inline'] = {display:"inline"}
css['.arr-inline>*'] = {
    borderRight:borderStyle,
    paddingLeft:5,
    paddingRight:5}
//#endregion