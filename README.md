# Alion
This is an editor whose purpose is to allow you to view and edit any data in any form but in a shared environment.

This editor is based on a single node tree. Each node is attached to a specific javascript object, provides the ability to reactively interact with it, and binds additional data (metadata) to it.  
This project uses its own system of generating html and css (GUI system), and its own system of events. No third party libraries. 

![Screenshot](./scr.png)

## Features
+ Saving serializable objects to local storage
+ quick input and own clipboard
+ base interfaces for primitive types (string, number, boolean)
+ dynamic function call

## installation
1. Install [Flask](https://flask.palletsprojects.com/en/1.1.x/)  
2. Run *server.py* file   
3. open <a href="localhost:2020/">localhost:2020/</a> in Chrome browser
