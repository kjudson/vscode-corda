import React from "react";
import "../component-style/FlowExplorerIndex.css";

import FlowInfoDisplay from "./FlowInfoDisplay";
import VaultTransactionDisplay from "./VaultTransactionDisplay";
import NodeInfo from "./NodeInfo";
import NodeSelector from "./NodeSelector";

import SnackBarWrapper from "./SnackBarWrapper";
import Grid from '@material-ui/core/Grid';



export default class VaultQueryIndex extends React.Component {

    constructor(props) {
       super(props)
       this.state = {
            selectedNode : "PartyA",
            connections: {},
            nodeInfo : null,
            flowNames: [],
            flowParams:null,
            transactionMap: null,
            client: null,
            messages : []
        }
     
        let _this = this;
        this.state.allNodes = JSON.parse(document.getElementById('nodeList').innerHTML);
       // console.log("all nodes = " + JSON.stringify(this.state.allNodes))
        this.state.allNodes.forEach(function(node) {
            if(node.rpcUsers){
                _this.state.connections[node.name] = {
                    host: node.rpcSettings.address,
                    username: node.rpcUsers.user,
                    password: node.rpcUsers.password,
                    cordappDir: node.cordappDir   
                }
            }
          //  console.log("added node")
        });
       this.handleChange = this.handleChange.bind(this);
      
       this.messageHandler = this.messageHandler.bind(this);
       this.flushNode = this.flushNode.bind(this);
       this.removeSnack = this.removeSnack.bind(this);
       
       // wait for websocket server to go up - 4 second delay between tries
        (function wsCon() {
        var ws = new WebSocket("ws://localhost:8080/session");
            setTimeout(function() {
                if (ws.readyState != 0 && ws.readyState != 1) {
                    console.log("attempting connect");
                    console.log(ws.readyState)
                }
                if (ws.readyState != 1) {
                    wsCon();
                } else {
                    _this.setState({
                        client: ws
                    })
                    //_this.state.client = ws;
                    _this.state.client.onmessage = (event) => {
                        _this.messageHandler(event);
                    }
                }
            }, 4000)
        })();
  
    }


    messageHandler(event) {
        //console.log(event.data)
        var evt = JSON.parse(event.data);
        var content = JSON.parse(evt.content);
        var result = JSON.parse(evt.result);

       console.log("result: " + evt.result);
       console.log("command received: " + evt.cmd);
       console.log("returned content: " + evt.content);

        if (evt.cmd == "getNodeInfo") {
            this.setState({
                nodeInfo : content
            })
        }

  

          if(evt.cmd === "getTransactionMap" || evt.cmd === "vaultTrackResponse"){
             // console.log(Object.values(content))
              this.setState({
                  transactionMap: Object.values(content)
              })
          }

         
            

        if(result.status === 'ERR'){
            this.state.messages.push({content: "An error occured: " + result.result,
                                        type: "error"
            })
            this.setState(
                this.state.messages
            )
        }

    }

    removeSnack(item){
        //console.log("remove: " +  JSON.stringify(item))
        //console.log(item)
        this.state.messages = this.state.messages.reverse();
        var index = this.state.messages.indexOf(item)
        //console.log(index)
        if(index > -1) {
            this.state.messages.splice(index, 1);
        }
        this.state.messages = this.state.messages.reverse();
        //console.log(JSON.stringify(this.state.messages))
        this.setState(this.state.messages);
    }

    chosenNode(connection) {
        // propagate initial node info
       // this.client.onopen = () => {
            this.state.client.send(JSON.stringify({"cmd":"connect","content":JSON.stringify(
                connection
            )}));
            
        //}    
    }

    loadNodeInfo(){
        this.state.client.send(JSON.stringify({"cmd":"getNodeInfo"}));
    }

  
    loadTransactionHistory(){
        this.state.client.send(JSON.stringify({"cmd": "getTransactionMap"}))
    }


    flushNode(){
        this.setState({
            nodeInfo : null,
            flowNames: [],
            flowParams:null,
            transactionMap: null
        })
       
    }
    

    handleChange(value){
        this.setState({
            selectedNode: value
        })
        if (value){
            this.chosenNode(this.state.connections[value])
            this.loadNodeInfo()
            this.loadTransactionHistory()
        }else{
            this.flushNode()
        }
   }
   
   
   render() {
        if (this.state.client == null) {
            return (
                <div>
                    Waiting for Node Server.
                    <div class="fa-3x">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            )
        }

       let DisplayNodeInfo = null;
       let DisplayVaultTransactions = null;
       if(this.state.nodeInfo){
           DisplayNodeInfo = <NodeInfo nodeInfo = {this.state.nodeInfo} />
           
       }
       if(this.state.flowParams){
           DisplayFlowList = <FlowInfoDisplay selectedNode = {this.state.selectedNode} flowNames = {this.state.flowNames} flowParams = {this.state.flowParams} startFlow = {this.startFlow} />
       }

       if(this.state.transactionMap){
           DisplayVaultTransactions = <VaultTransactionDisplay transactionMap = {this.state.transactionMap} />
       }
       return (
            <div>
                <Grid container spacing={4}>
                    <Grid item sm={6}>
                        <NodeSelector allNodes = {this.state.allNodes} handleChange = {this.handleChange} />
                    </Grid>
                </Grid>
                <Grid  container spacing={4}>
                    <Grid item sm={4}> {DisplayNodeInfo} </Grid>
                </Grid>
                <Grid container justify = "center" alignitems="center" >
                    <Grid item sm={4} ></Grid>
                    <Grid item sm={5}> {DisplayVaultTransactions} </Grid>
                </Grid>
                {this.state.messages.map((message, index) => { 
                   
                    return ( <SnackBarWrapper key={"error" + index} message={message} remove={this.removeSnack}/>);
                })}
               
            </div>
                
            
    )
  }
}