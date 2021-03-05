import Node, { EventEmitter,mouseBufer,MouseBufer } from "./Node.js"
import css from "./StyleManager.js"
export const Page = new Map()
export const Inline = new Map()
export const Icons = new Map()
export const Block = new Map()
export const ToolButtons = new Map()
Block.canBeFn = true
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
function EventConfig(el,name,props,args){
    if(this instanceof EventEmitter){
        if(props.nodeEvents){
            const evts = props.nodeEvents;
            delete props.nodeEvents;
            for(const name in evts){
                this.on(name,el,evts[name])
            }
        }else if(typeof name =="function"){
            this.on('changed',el,()=>{
                el.replaceWith(e(name,{this:this,...props},args))
            })
        }
    }
}
const AwaitViewNode = new Node('await',null,null)
/**@param {String} name @returns {HTMLElement}
@param {HTMLElement} props
*/
export function e(name,props={},...args){
    /**@type {HTMLElement} */
    var el;
    var _this = this
    if(props.this){_this = props.this;delete props.this}
    if(typeof name == "function"){
        el = name.apply(_this,args)
        if(el instanceof Promise){// TODO delete this tile
            AwaitViewNode.target = el
            const tempEl = AwaitViewNode.find(Page)
            el.then((asyncEl)=>{
                for(const fn of e.configs){
                    fn.apply(_this,[asyncEl,name,props,args])
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
        fn.apply(_this,[el,name,props,args])
    }
    return el
}
e.configs = [EventConfig,config]
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
            const mNode = mouseBufer.node
            const name = $inp.value||mNode?.name
            const val = mNode?.target
            if(name){
                mouseBufer.setInput('')
                this.add(name,val)
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
const foldingBtn = {
    ico:"ᐊ",
    /**@param {HTMLElement} line,@param {HTMLElement} btn */
    click(btn,line){
        if(!line.hasSubView){
            const blockFn = this.find(Block)
            const $block = this.e(blockFn,{
                style:{borderRight:"2px solid #333",borderLeft:"4px solid black"}
            })
            line.after($block)
            line.expanded = true
            line.hasSubView = true
        }else{line.expanded = !line.expanded}

        line.nextSibling.style.display = line.expanded?null:"none"
        btn.textContent = line.expanded?"ᐁ":"ᐊ"
    }
} 
function AttrLineView(node,attr,showName=true){
    const child = node.getChild(attr)
    const nameProps = {
        attr:{title:attr},
        onclick(){
            const ev = new CustomEvent('go',{bubbles:true,detail:child})
            this.dispatchEvent(ev)
        },
        oncontextmenu(ev){
            if(mouseBufer.input){
                node.setChild(attr,mouseBufer.node)
                mouseBufer.setInput('')
            }else{mouseBufer.setInput(child.path)}
            ev.preventDefault()
        }
    }
    //#region toolbar
    const $toolBtns = []
    const toolBtns = [...(child.find(ToolButtons)||[]),foldingBtn]
    for(const btn of toolBtns){
        $toolBtns.push(e('div',{
            onclick(){btn.click.apply(child,[this,this.parentNode.parentNode])},
            ...(btn.config||{})
        },btn.ico))
    }
    const toolBar = e('div',{class:"tool-bar"},$toolBtns)   
    //#endregion
    const name = e('span',nameProps,[showName?attr+' : ':""])
    const icon = e(ico,nameProps,child.find(Icons))
    const lineProps = {
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
    return e('div',lineProps,[icon,name,child,toolBar])
}
css['.attr'] = {
    padding:3,
    borderBottom:borderStyle,
    lineHeight:"25px",
    whiteSpace:"nowrap",
    overflowX:"hidden",
    position:"relative",
}
css['.attr>.tool-bar'] = {position:"absolute",
    right:0,top:0,bottom:0,fontWeight:"bold"
    }
    css['.attr>.tool-bar>*'] = {
        color:"white",
        backgroundColor:"black",
        height:"100%",
        width:30,
        display:"inline-block",
        textAlign:"center",
        lineHeight:"30px"
    }
css['.attr>.ico-box'] = {marginRight:3}
function addChangeEvents(node,$el){
    node.on('childChanged',$el,async (name)=>{
        const newEl = AttrLineView(node,name)
        for(const el of $el.children){
            if(el.name==name){
                if(newEl){
                    el.replaceWith(newEl)
                }else{
                    $el.removeChild(el)
                }
                return
            }
        }
        $el.append(newEl)
    })
    node.on('childRemoved',$el,(name)=>{
        for(const el of $el.children){
            if(el.name==name){$el.removeChild(el)}}
    })
}
async function BlockObject(){
    const $attrs = []
    const attrs = await this.getChilds()
    for(const attr of attrs){
        $attrs.push(AttrLineView(this,attr))
    }
    const $el = e('div',{},$attrs)
    addChangeEvents(this,$el)
    return $el
        
}
function PageObject(){
    const node = this
    const $el = e('div')
    if(!this.target){return "null"}
    /**@type {HTMLElement} */
    const blockFn = this.find(Block)
    return e($el,{class:"object-page"},[
        this.e(SearchLine),
        e(vport,{class:'attrs'},this.e(blockFn))
    ])
    
}
function InlineObject(){
    if(this.target==null){return e('span',{},["null"])}
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
    border:borderStyle
}

Page.set(Object,PageObject)
Inline.set(Object,InlineObject)
Block.set(Object,BlockObject)
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
MouseBufer.handlers.push((m)=>{
    m.variants.push({
        sufix:"",
        order:3,
        value:m.input
    })
})
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
    return e($ret,{},[num])
}
Icons.set(Number,'/icons/number.svg')
Inline.set(Number,InlineNumber)
ToolButtons.set(Number,[
    {ico:"-",click(){this.set(this.target-1)}},
    {ico:"+",click(){this.set(this.target+1)}},
])
MouseBufer.handlers.push((m)=>{
    const number = parseFloat(m.input)
    const isNum = m.input.match(/^\d+\.?\d*$/)
    if(isNum){
        m.variants.push({
            sufix:"",
            order:4,
            value:number
        })
    }
})
//#endregion
//#region func
function InlineFunc(){
    return e('span',{},[`${this.target.name}(${this.target.length})`])
}
Icons.set(Function,function(){return "/icons/"+(this.target.prototype?"class.svg":"function.svg")})
Inline.set(Function,InlineFunc)
ToolButtons.set(Function,[
    {ico:"▶",click(){
        const caller = this.parent.target
        const result = this.target.apply(caller,[mouseBufer.getValue()])
        mouseBufer.setValue(result,'function Result')
    }},
])
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
Block.set(Array,function BlockArray(){
    const $items = []
    for(const i in this.target){
        $items.push(AttrLineView(this,i,false))
    }
    const $el = e('div',{},$items)
    addChangeEvents(this,$el)
    return $el
})
css['.arr-inline'] = {display:"inline"}
css['.arr-inline>*'] = {
    borderRight:borderStyle,
    paddingLeft:5,
    paddingRight:5}
//#endregion