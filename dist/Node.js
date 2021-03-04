export const Proto = new Map()
export function $(str,...args){
    var path = ''
    for(const i in args){
        path += str[i]+args[i]
    }
    path+=str[args.length]
    return Node.fromPath(path)
}
Function.prototype.mixin = function(mx){Object.assign(this.prototype,mx)}
var idscounter = 0
const Primitives = ['string','boolean','number']
export class EventEmitter{
    on(name,owner,fn){
        if(!this._events){this._events = {}}
        if(!this._events[name]){this._events[name] = new Map()}
        if(owner instanceof HTMLElement && !owner.isConnected){
            document.body.append(owner)
        }
        this._events[name].set(owner,fn)
    }
    emit(name,...args){
        /**@type {Map} */
        const map = this._events?.[name]
        if(!map){return}
        const owners = Array.from(map.keys())
        for(const owner of owners){
            if(owner instanceof HTMLElement && !owner.isConnected){
                map.delete(owner);
                continue
            }
            map.get(owner).apply(owner,args)
        }
    }
    removeListener(name,owner){
        const arr = this._events?.[name]
        if(!arr){return}
        arr.delete(owner)
    }
}
export class MouseBufer extends EventEmitter{
    mouseNode = new Node('mouse_val')
    input=""
    /**@type {Array<(mb:MouseBufer)=>null>}*/
    static handlers = []
    variants = []
    index = 0
    setInput(val){this.input = val;this.changed();this.index=0}
    setValue(value,name){this.input = name||"";this.variants.push({value});this.emit('changed',this,this)}
    get selected(){
        if(!this.variants)return
        this.index = Math.max(0,Math.min(this.index,this.variants.length-1))
        return this.variants[this.index]
    }
    get node(){
        const val = this.selected?.value
        if(val===undefined||val instanceof Node){return val}
        this.mouseNode.target = val
        return this.mouseNode
    }
    async changed(){
        this.variants = []
        if(this.input){
            for(const handler of MouseBufer.handlers){
                await handler(this)
            }
        }
        this.variants.sort((a,b)=>(b.order||0)-(a.order||0))
        this.emit('changed',this,this)
    }
    constructor(){
        super()
        addEventListener('keydown',(ev)=>{
            const isINPUT = ["INPUT","TEXTAREA"].includes(ev.target.tagName.toUpperCase())
            const isEDITABLE = ev.target.hasAttribute('contenteditable')
            if(isINPUT||isEDITABLE){return}
            ev.preventDefault()
            if(ev.key.length==1){
                this.setInput(this.input+ev.key);
            }else if(ev.key=="Backspace" && this.input.length){
                this.setInput(this.input.substr(0,this.input.length-1))
            }else if(ev.key=="ArrowUp"){
                this.index-=1;
                if(this.index<0){this.index = this.variants.length}
                this.emit('changed',this,this)
            }else if(ev.key=="ArrowDown"){
                this.index =(this.index+1)%this.variants.length
                this.emit('changed',this,this)
            }
            else if(ev.key=="Tab"){
                if(this.input)
                this.setInput(this.input+this.selected.sufix||'');
            }else{console.log(ev.key)}
        })
    }
}
export default class Node extends EventEmitter{
    static count = 0
    constructor(name,par,target){
        super()
        this._id = idscounter++
        Node.count++;
        this.parent = par;
        this.name = name;
        if(target!=null){this.target = target}
        const proto = this.find(Proto)
        if(proto){
            proto.__proto__ = Node.prototype
            this.__proto__ = proto
            if(proto.hasOwnProperty('constructor')){proto.constructor.apply(this)}
        } 
    }
    childs={}
    /**@returns {Node} */
    static fromPath(path){
        var node = Node.root
        if(path.startsWith('/')){path = path.substr(1)}
        if(path){
            if(path.includes('/')){
                const keys = path.split('/')
                for(const key of keys){
                    if(node==null)break
                    node = node.getChild(key)
                }
            }else{node = node.getChild(path)}
            
        }
        return node
    }
    /** call changed for this node and all parents */
    static update(node){
        var prew = null
        while(node){
            node.changed(prew)
            prew = node;
            node = node.parent;
        }
    }
    get path(){
        const names = []
        var node = this;
        while(node){
            names.unshift(node.name);
            node = node.parent
        }
        return names.length>1?names.join('/'):'/'
    }
    find(attr,...args){
        const getFromMap = (key)=>{
            const ret = attr.get(key)
            if(typeof ret =="function"&&!attr.canBeFn){
                return ret.apply(this,args)
            }
            return ret
        }
        if(this.m&&this.m.has(attr)){return this.m.get(attr)}
        if(attr instanceof Map){
            if(this.target==null){
                if(attr.has(this.target)){return getFromMap(this.target)}
            }else{
                let obj = this.target
                while(obj!=null){
                    const cls = obj.constructor
                    if(cls&&attr.has(cls)){return getFromMap(cls)}
                    obj = obj.__proto__
                }
            }
            return getFromMap(Object)
        }
        return this[attr]
    }
    changed(child){
        if(!child&&this.parent){this.parent.target[this.name] = this.target}
    }
    get(name){
        return this.target[name]
    }
    getChilds(){
        return Object.getOwnPropertyNames(this.target)
    }
    getChild(name){
        if(this.childs.hasOwnProperty(name)){
            const savedNode = this.childs[name]
            if(Primitives.includes(typeof savedNode.target)){
                const updatedVal = this.get(name)
                if(updatedVal instanceof Promise){
                    updatedVal.then((vl)=>savedNode.target = vl)
                }else{savedNode.target = updatedVal}
            }
            return savedNode
        }
        const childNode = new Node(name,this,this.get(name))
        this.childs[name] = childNode
        return childNode;
    }
    set(val,caller){
        this.target = val;
        Node.update(this)
        this.emit('changed',caller)
    }
    setChild(name,node){// TODO dont create new Node
        const newNode = new Node(name,this,node.target)
        this.childs[name] = newNode
        Node.update(newNode)// dont set value to Storage
        this.emit('childChanged',name)
        return newNode
    }
    add(name,val=null){
        this.target[name] = val;
        Node.update(this.getChild(name))
        this.emit('childChanged',name)
        this.emit('changed',null)
    }
    deleteChild(name){// TODO delete child
        delete this.target[name]
        delete this.childs[name]
        // TODO #ifbugs Node.update(this)
        this.emit('childRemoved',name)
        this.emit('changed')
    }
}
MouseBufer.handlers.push(async (m)=>{
    if(!m.input.startsWith('/'))return
    const names = m.input.split('/')
    names.shift()
    const last = names.pop()
    var node = Node.root
    for(const name of names){
        node = node.getChild(name)
        if(node.target==null){console.log("no target")
            return}
    }
    console.log
    const childNames = await node.getChilds()
    for(const childName of childNames){
        if(childName.startsWith(last)||childName==last)
        m.variants.push({
            order:4,
            sufix:childName.substr(last.length),
            value:node.getChild(childName)
        })
    }
})
export const mouseBufer = new MouseBufer()
window.Node=Node
Node.mixin(EventEmitter)