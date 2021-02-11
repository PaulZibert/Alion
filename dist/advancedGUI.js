import {Proto} from "./Node.js"
import Node from "./Node.js"
import {Icons,Inline,Page} from "./BaseGUI.js"
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
                ok(new Node(name,this,req.result))
            }
        })
        
    }
})
Proto.set(IDBDatabase,{
    async getChilds(){
        return Object.keys(this.target.objectStoreNames)
    }    
})
