import Node from './Node.js'
import {Proto,$} from "./Node.js"
import defEnv from "./Enviroment.js"
import {Page} from "./BaseGUI.js"
import "./SorageModule.js"
import "./advancedGUI.js"
import {update as styleUpdate} from "./StyleManager.js"
var root = {window,autor:{name:"Paul",age:20},arr:[1,2,'three'],storage:localStorage,IDB:indexedDB}
Node.root = new Node('',null,root)
document.body.append(defEnv())
styleUpdate()
window.Node = Node