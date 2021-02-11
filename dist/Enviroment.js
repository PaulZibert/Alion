import {e,Page,ico,vport,borderStyle,Icons,MouseNode} from "./BaseGUI.js"
import css from "./StyleManager.js" 
import Node from "./Node.js"
export const WindowBrowser = {
    el:null,
    node:new Node('node'),
    open(node,save=true){
        this.node.set(node);
        /**@type {HTMLElement} */
        const page = node.find(Page)
        if(this.el){this.el.replaceWith(page);}
        this.el = page;
        if(save){history.pushState(null,node.name,node.path)}
        page.addEventListener('go',(e)=>{this.open(e.detail)})
    },
    init(){
        if(this.el){return this.el}
        this.open(Node.fromPath(decodeURI(location.pathname)))
        window.addEventListener('popstate',async ()=>{
            this.open(await Node.fromPath(decodeURI(location.pathname)),false)
        })
        return this.el
    }
}
export class Browser{
    hist = []
    el=e('div');
    node = new Node('node',null,null)
    open(node,save=true){           
        if(this.node.target&&save){this.hist.push(this.node.target)}
        this.node.set(node)
        const page = node.find(Page)
        this.el.replaceWith(page);
        this.el = page;
        page.addEventListener('go',(e)=>{this.open(e.detail)})
    }
    back(){
        const node = this.hist.pop()
        if(node){this.open(node,false)}
    }
}
function ToolBar(node){
    function nodeInfo(){return e('span',{},[
        e(ico,{style:{marginRight:5}},this.target.find(Icons)),
        this.target.name
    ])}
    const tools = e('div',{class:"right-side"},[
        e(ico('/icons/trash.svg'),{
            ondragover(e){e.preventDefault()},
            ondrop(ev){
                const path = ev.dataTransfer.getData('node')
                const node = Node.fromPath(path)
                node.del();
            },
            onclick(){
                if(MouseNode.target){MouseNode.set(null);return}
                if(confirm(`delete ${node.target.path}`)){
                    node.target.del()
                }
            }
        })
    ])
    return e('div',{class:"tool-bar"},[node.e(nodeInfo),tools])
}
css['.tool-bar'] = {fontSize:30,
    borderBottom:borderStyle,
    marginBottom:4,
}
css['.right-side'] = {float:"right"}
export default function env(){
    const sideBrowser = new Browser()
    const Bufer = MouseNode.el
    // setup topnav
    const path = e('div',{style:{width:"100%",marginLeft:5}})
    const backBtn = e('button',{onclick(){sideBrowser.back()},class:"sqr-btn"},['b'])
    const sidenav = e('div',{class:"tool-line"},[backBtn,path])
    sideBrowser.node.on('changed',sidenav,function(){path.textContent = sideBrowser.node.target.path})
    //setup sidePage
    sideBrowser.open(Node.root)
    const sidePage = e('div',{class:"sidepage"},[sidenav,sideBrowser.el])
    const Content = e('main',{},[WindowBrowser.init(),sidePage])
    return e('div',{class:"env",spage:sideBrowser},[Bufer,ToolBar(WindowBrowser.node),e(vport,{style:{height:"100%"}},[Content])])
}
css['.env'] = {display:"flex",flexDirection:"column",height:"100%",maxWidth:800,width:800}
css['.env main'] = {display:"flex",height:"100%"}
css['.env main>*'] = {width:"100%"}
css['.env main>.sidepage'] = Object.assign({marginLeft:5},css['.object-page'])
