export const Proto = new Map()
export function $(str,...args){
    var path = ''
    for(const i in args){
        path += str[i]+args[i]
    }
    path+=str[args.length]
    return Node.fromPath(path)
}
const Primitives = ['string','boolean','number']
export default class Node{
    static count = 0
    constructor(name,par,target){
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
                savedNode.target = this.get(name)
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
    setChild(name,node){
        this.getChild(name).target = node.target
        Node.update(this)
        this.emit('childChanged',name)
    }
    add(name,val=null){
        this.target[name] = val;
        Node.update(this)
        this.emit('childChanged',name)
    }
    del(){
        if(!this.parent){return}
        delete this.parent.target[this.name]
        delete this.parent.childs[this.name]
        Node.update(this.parent)
        this.parent.emit('childRemoved',this.name)
        this.target = null
    }
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