import {Proto} from "./Node.js"
import Node from "./Node.js"
import {Icons,Inline,Page,e} from "./BaseGUI.js"
//#region localStorage
Proto.set(Storage,{
    get(name){
        if(name!="length"){
            try{
                return JSON.parse(this.target[name])
            }catch(er){
                return this.target[name]
            }
        }
    },
    changed(child){
        if(!child)return
        this.target[child.name] = JSON.stringify(child.target)
    }
})
async function getDBVersion(name){
    const dbs = await indexedDB.databases()
    for(const db of dbs){
        if(db.name==name){return db.version}
    }
}
Proto.set(IDBFactory,{
    async getChilds(){
        const dbs = await indexedDB.databases()
        return dbs.map(d=>d.name)
    },
    get(name,updFunc){
        return new Promise(async (ok)=>{
            let version = await getDBVersion(name)
            if(!version){ok(null);return}
            if(updFunc){version+=1}
            const req = indexedDB.open(name,version)
            req.onsuccess = ()=>{
                ok(req.result)
            }
            if(updFunc){
                req.onupgradeneeded = updFunc
            }
        })
        
    },
    add(key,val){
        const req = indexedDB.open(key,1)
        req.onsuccess = ()=>{
            this.emit('childChanged',key)
            this.emit('changed')
        }
    },
    deleteChild(key){
         const req = indexedDB.deleteDatabase(key);
        delete this.childs[key]
        this.emit('childRemoved',key)
        this.emit('changed')       
    }
})
Proto.set(IDBDatabase,{
    getChilds(){
        return this.target.objectStoreNames
    },
    async add(name,val){
        this.target.close()
        this.target = await this.parent.get(this.name,(ev)=>{
            /**@type {IDBDatabase} */
            const db = ev.target.result
            db.createObjectStore(name)
        })
        this.emit('childChanged',name)
        this.parent.emit('childChanged',this.name)
    },
    get(name){
        return this.target.transaction(name,'readwrite').objectStore(name)
    }
})
Proto.set(IDBObjectStore,{
    getChilds(){
        return new Promise((ok)=>{
            /**@type {IDBDatabase} */
            const db = this.target.transaction.db
            const store = db.transaction(this.name,'readonly').objectStore(this.name)
            const req = store.getAllKeys()
            req.onsuccess = ()=>{
                ok(req.result)
            }
        })
    },
    add(key,val,){
        /**@type {IDBDatabase} */
        const db = this.target.transaction.db
        const store = db.transaction(this.name,'readwrite').objectStore(this.name)
        const res = store.put(val,key)
        res.onsuccess = ()=>{
            this.emit('childChanged',key)
            this.emit('changed')
        }
    },
    get(key){
        return new Promise((ok)=>{
            /**@type {IDBDatabase} */
            const db = this.target.transaction.db
            const store = db.transaction(this.name,'readonly').objectStore(this.name)
            const req = store.get(key)
            req.onsuccess = ()=>{ok(req.result)}
        })
    },
    deleteChild(key){
        /**@type {IDBDatabase} */
        const db = this.target.transaction.db
        const store = db.transaction(this.name,'readwrite').objectStore(this.name)
        store.delete(key)
        delete this.childs[key]
        this.emit('childRemoved',key)
        this.emit('changed')
    },
    changed(n){
        if(!n)return
        /**@type {IDBDatabase} */
        const db = this.target.transaction.db
        const store = db.transaction(this.name,'readwrite').objectStore(this.name)
        store.put(n.target,n.name)
    }
})
Proto.set(Promise,{
    async constructor(){
        const result = await this.target
        const resNode = new Node(this.name,this.parent,result)
        resNode.childs = this.childs
        this.parent.childs[this.name] = resNode
        this.parent.emit('childChanged',this.name)
    },
    async get(name){
        const result = await this.target;
        const newNode = this.parent.getChild(this.name)
        return newNode.get(name)       
    }
})
Inline.set(Promise,function(){
    return e('span',{},['wait'])
})
Page.set(Promise,()=>e('div',{},['loading page...']))
