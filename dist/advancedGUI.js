import {Proto} from "./Node.js"
import Node from "./Node.js"
import {Icons,Inline,Page,e} from "./BaseGUI.js"
//#region localStorage
Proto.set(Storage,{
    get(name){
        console.log('get',name)
        if(name!="length"){
            try{
                return new Node(name,this,JSON.parse(this.target[name]))
            }catch(er){
                return new Node(name,this,this.target[name])
            }
        }
    },
    changed(child){
        if(!child)return
        this.target[child.name] = JSON.stringify(child.target)
    }
})
Proto.set(IDBFactory,{
    async getChilds(){
        const dbs = await indexedDB.databases()
        return dbs.map(d=>d.name)
    },
    get(name){
        return new Promise((ok)=>{
            const req = indexedDB.open(name,1)
            req.onsuccess = ()=>{
                ok(req.result)
            }
        })
        
    }
})
Proto.set(IDBDatabase,{
    getChilds(){
        return Object.keys(this.target.objectStoreNames)
    },
    add(name,val){
        console.log(this)
    },    
})
Proto.set(Promise,{
    async constructor(){
        this.target = await this.target
        const clone = new Node(this.name,this.parent,this.target)
        this.parent[this.name] = clone
        this.emit('changed')
    },
    async get(name){
        const val = await this.target;
        this.target = val;
        return null
    }
})
Inline.set(Promise,function(){
    const temp = e('span',{},['wait'])
    this.target.then((val)=>{
        console.log(val)
        this.target = val
        this.parent.emit('childChanged',this.name)
    })
})
