//% color=#0fbc11 icon="\uf1eb"
namespace IoT_Bit_naim {
    enum Cmd {
        None,
        ConnectWifi,
        ConnectThingSpeak,
        ConnectKidsIot,
        InitKidsIot,
        UploadKidsIot,
        DisconnectKidsIot,
        ConnectMqtt,
    }

    export enum KidsIotSwitchState {
        //% block="on"
        on = 1,
        //% block="off"
        off = 2
    }
    let temp_cmd = ""
    export enum httpMethod {
        //% block="GET"
        GET,
        //% block="POST"
        POST





    }


    export enum SchemeList {
        //% block="TCP"
        TCP = 1,
        //% block="TLS"
        TLS = 2
    }

    export enum QosList {
        //% block="0"
        Qos0 = 0,
        //% block="1"
        Qos1,
        //% block="2"
        Qos2
    }

    let wifi_connected: boolean = false
    let thingspeak_connected: boolean = false
    let kidsiot_connected: boolean = false
    let mqttBrokerConnected: boolean = false
    let userToken_def: string = ""
    let HTTP_received: (Error_code: string, Data: string) => void = null;
    let topic_def: string = ""
    const mqttSubscribeHandlers: { [topic: string]: (message: string) => void } = {}
    const mqttSubscribeQos: { [topic: string]: number } = {}
    let mqtthost_def = "ELECFREAKS"
    let iftttkey_def = ""
    let iftttevent_def = ""

    let recvString = ""
    let currentCmd: Cmd = Cmd.None

    const THINGSPEAK_HOST = "api.thingspeak.com"
    const THINGSPEAK_PORT = "80"
    const KIDSIOT_HOST = "139.159.161.57"
    const KIDSIOT_PORT = "5555"
    let array_keys: Array<string> = []
    const EspEventSource = 3000
    const EspEventValue = {
        None: Cmd.None,
        ConnectWifi: Cmd.ConnectWifi,
        ConnectThingSpeak: Cmd.ConnectThingSpeak,
        ConnectKidsIot: Cmd.ConnectKidsIot,
        InitKidsIot: Cmd.InitKidsIot,
        UploadKidsIot: Cmd.UploadKidsIot,
        DisconnectKidsIot: Cmd.DisconnectKidsIot,
        ConnectMqtt: Cmd.ConnectMqtt,
        PostIFTTT: 255
    }
    let connecting_flag = false
    let flag = true;
    let Wan_connected = false
    let Thingspeak_conn: (Status: string, Error_code: string) => void = null;
    const KidsIotEventSource = 3100
    let Wifi_connected = "0"
    let IP = false
    let version = ""
    let ip = ""
    let OLED_FLAG = false;
    let device_id = ""
    let httpReturnString: string = ""
    const KidsIotEventValue = {
        switchOn: KidsIotSwitchState.on,
        switchOff: KidsIotSwitchState.off
    }
    let array_values: Array<string> = []
    let TStoSendStr = ""

    // write AT command with CR+LF ending
    function sendAT(command: string, wait: number = 0) {
        serial.writeString(`${command}\u000D\u000A`)
        basic.pause(wait)
    }

    function restEsp8266() {
        sendAT("AT+RESTORE", 1000) // restore to factory settings
        sendAT("AT+RST", 1000) // rest
        serial.readString()
        sendAT("AT+CWMODE=1", 500) // set to STA mode
        sendAT("AT+SYSTIMESTAMP=1634953609130", 100) // Set local timestamp.
        sendAT(`AT+CIPSNTPCFG=1,8,"ntp1.aliyun.com","0.pool.ntp.org","time.google.com"`, 100)
    }
    let IFTTT_conn: (Status: string, Error_code: string) => void = null;

    /**
     * Initialize ESP8266 module
     */
    //% block="set ESP8266|RX %tx|TX %rx|Baud rate %baudrate"
    //% tx.defl=SerialPin.P8
    //% rx.defl=SerialPin.P12
    //% ssid.defl=your_ssid
    //% pw.defl=your_password weight=100
    export function initWIFI(tx: SerialPin, rx: SerialPin, baudrate: BaudRate) {
        serial.redirect(tx, rx, BaudRate.BaudRate115200)
        basic.pause(100)
        serial.setTxBufferSize(128)
        serial.setRxBufferSize(128)


        //add  1s for UART ready to support Micro:bit V2
        basic.pause(1000)
        ///////////////////////////////////////////////////



        let Wifi_sender: (status: string, Error_code: string) => void = null;





        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
            temp_cmd = serial.readLine()
            //OLED.writeStringNewLine(temp_cmd)
            let tempDeleteFirstCharacter = ""
            let OTA_recevied: (PercentageValue: string) => void = null;
            let Wifi_Remote_create: (channel: string, Error_code: string) => void = null;
            //let Wifi_Remote_Conn_value: (channel: string, WifiMessage: string, Value: number) => void = null;
            let WAN_Control_Conn: (Device_ID: string, Error_code: string) => void = null;
            let Wifi_DisConn: (Error: string) => void = null;
            let thingspeak_error = ""
            let http_error_code = ""
            let OTA_Finished: () => void = null;
            let HTTP_receive_end = true;
            let OTA_Failed: (Message: string) => void = null;
            let NTP_Receive: (Year: number, Month: number, Day: number, Hour: number, Minute: number, Second: number) => void = null;
            let Wifi_Remote_Conn: (channel: string, WifiMessage: string) => void = null;
            let Wifi_Remote_Conn_value: (channel: string, WifiMessage: string, Value: number) => void = null;
            let WAN_Remote_Conn: (WAN_Command: string) => void = null;
            let disconnect_error_code = ""
            let WAN_Remote_Conn_value: (WAN_Command: string, Value: number) => void;
            let Wifi_Conn: (IP: string, ID: string) => void = null;

            if (temp_cmd.charAt(0).compare("W") == 0) { //start with W
                let space_pos = temp_cmd.indexOf(" ")
                let label = temp_cmd.substr(1, space_pos - 1)
                if (label == "0") { //W0 - Initialize
                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    version = response[1]
                    device_id = response[2]
                    /*
                    if(OLED_FLAG==true&&connecting_flag==false){
                    OLED.clear()
                    OLED.writeStringNewLine("Initialize OK")
                    OLED.writeStringNewLine("Smarthon IoT:Bit")
                    OLED.writeStringNewLine("Version:"+version)
                    }
                    */
                }
                else if (label == "1") { //W1 - Connect WIFI
                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    if (response[1] == "0") {

                        Wifi_connected = "0"
                        //Wifi_DisConn()
                        if (response[2] != null) {

                            if (OLED_FLAG == true) {
                                connecting_flag = false
                                //OLED.newLine()
                                //OLED.writeStringNewLine("Timeout")
                            }
                        }
                    }
                    else if (response[1] == "1") {
                        Wifi_connected = "1"
                        if (OLED_FLAG == true && connecting_flag == false) {
                            connecting_flag = true
                            //OLED.writeString("Connecting.")
                        } else if (OLED_FLAG == true && connecting_flag == true) {
                            //OLED.writeString(".")
                        }

                    }
                    else if (response[1] == "2") {
                        Wifi_connected = "2"
                        if (response[2] != null) {
                            ip = response[2]
                            //Wifi_Conn()


                            if (OLED_FLAG == true) {
                                connecting_flag = false
                                //OLED.newLine()

                                //OLED.writeStringNewLine("IP:"+ip)
                            }

                            startWebServer_WAN()
                            basic.pause(500)
                            if (Wifi_Conn && Wifi_connected == "2") Wifi_Conn(ip, device_id)

                        }

                    }
                    else if (response[1] == "3") {
                        Wifi_connected = "3"
                        if (response[2] != null) {

                            disconnect_error_code = response[2]
                            if (Wifi_DisConn && Wifi_connected == "3") Wifi_DisConn(disconnect_error_code)
                            if (OLED_FLAG == true && connecting_flag == false) {
                                //OLED.writeStringNewLine("error:"+disconnect_error_code)
                            }

                        }
                    }
                }
                else if (label == "2") { //W2 Thingspeak
                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    if (Thingspeak_conn != null && response[1] == "0") {
                        if (OLED_FLAG == true) {
                            //OLED.writeStringNewLine("Thingspeak uploaded")
                        }
                        Thingspeak_conn("OK", "0")
                    }
                    else if (response[1] == "1") {
                        if (Thingspeak_conn != null && response[2] != null) {
                            thingspeak_error = response[2]
                            Thingspeak_conn("FAIL", thingspeak_error)
                        }
                        if (OLED_FLAG == true) {
                            //OLED.writeStringNewLine("Thingspeak upload")
                            //OLED.writeStringNewLine("fail code:"+thingspeak_error)
                        }
                    }
                }
                else if (label == "3") { //W3 IFTTT
                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    if (IFTTT_conn != null && response[1] == "0") {
                        IFTTT_conn("OK", "0")
                    }
                    else if (response[1] == "1") {
                        if (IFTTT_conn != null && response[2] != null) {
                            IFTTT_conn("FAIL", response[2])
                        }
                    }
                }
                else if (label == "4") { //W4 WAN
                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    if (response[1] == "0") {    //WAN start listen
                        if (WAN_Control_Conn != null) {
                            //WAN_Control_Conn(response[2],"0")    //return the channel ID
                        }
                    }
                    else if (response[1] == "1") {
                        if (WAN_Control_Conn != null) {
                            //WAN_Control_Conn(response[2],response[3])    //return the error code
                        }
                    }
                    else if (response[1] == "2") {//return message  

                        if (response[2].includes("$")) {       //with value
                            let pos = response[2].indexOf("$")
                            if (WAN_Remote_Conn_value != null) {
                                WAN_Remote_Conn_value(response[2].substr(0, pos), parseInt(response[2].substr(pos + 1, response[2].length)))
                            }
                        }
                        else {           //without value
                            if (WAN_Remote_Conn != null) {
                                WAN_Remote_Conn(response[2])
                            }

                        }
                    }
                }
                else if (label == "5") {  //W5 WIFI control
                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    if (response[1] == "0") {    //WIFI control start listen
                        if (Wifi_Remote_create != null && response[2] != null) {
                            Wifi_Remote_create(response[2], "0")
                        }
                    } else if (response[1] == "1") { //WIFI control listen fail
                        if (Wifi_Remote_create != null && response[2] != null && response[3] != null) { //W5 1 ID ERROR
                            Wifi_Remote_create(response[2], response[3])
                        }
                    } else if (response[1] == "2") { //WIFI control get Message
                        if (response[3].includes("$")) {       //with value
                            let pos = response[3].indexOf("$")
                            if (Wifi_Remote_Conn_value != null) {
                                Wifi_Remote_Conn_value(response[2], response[3].substr(0, pos), parseInt(response[3].substr(pos + 1, response[3].length)))
                            }
                        }
                        else {           //without value
                            if (Wifi_Remote_Conn != null) {
                                Wifi_Remote_Conn(response[2], response[3])
                            }
                        }
                    }
                }
                else if (label == "6") {//WiFi Sender

                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    if (Wifi_sender != null && response[1] == "0") {
                        Wifi_sender("OK", "0")
                    } else if (Wifi_sender != null && response[1] == "1") {
                        Wifi_sender("Fail", response[2])
                    }
                }
                else if (label == "7") {//NTP

                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    if (NTP_Receive != null && response[3] != null) {
                        NTP_Receive(parseInt(response[1]), parseInt(response[2]), parseInt(response[3]), parseInt(response[4]), parseInt(response[5]), parseInt(response[6]))
                    }
                }
                else if (label == "8") {//HTTP
                    //get the string include end_Indicator and msg char, e.g "0|a" "1|e"
                    let msg = temp_cmd.slice(temp_cmd.indexOf(" ") + 1, temp_cmd.length)
                    //split the end_Indicator and msg char
                    let response = msg.split('|')
                    if (HTTP_received != null && response[1] != null) { //skip if not use
                        if (response[0] == "2") {
                            http_error_code = response[1]
                        }
                        if (response[0] == "0") { //not the end of msg
                            if (HTTP_receive_end == true) { //if is start of msg, reset the msg string
                                httpReturnString = ""; //reset msg string
                            }
                            HTTP_receive_end = false; // not the end of receive msg
                            httpReturnString = httpReturnString + response[1] //build the msg string
                        }
                        if (response[0] == "1") {   // it is the end of msg
                            httpReturnString = httpReturnString + response[1] //build the msg string
                            HTTP_receive_end = true;    //indicate it is end
                            HTTP_received(http_error_code, httpReturnString) //call the handler to return the msg
                        }

                    }

                }
                else if (label == "9") {     //OTA
                    let response = temp_cmd.slice(1, temp_cmd.length).split(' ')
                    if (OTA_recevied != null && response[1] == "1") {
                        OTA_recevied(response[2])
                    } else if (OTA_Finished != null && response[1] == "2") {
                        OTA_Finished()
                    } else if (OTA_Failed != null && response[1] == "3") {
                        OTA_Failed(response[2])
                    }
                }

            }
        })
        basic.pause(500)
        serial.writeLine("(AT+W0)")
        basic.pause(2000)


        restEsp8266()
    }

    /**
     * connect to Wifi router
     */
    //% block="connect Wifi SSID = %ssid|KEY = %pw"
    //% ssid.defl=your_ssid
    //% pw.defl=your_pwd weight=95
    export function connectWifi(ssid: string, pw: string) {
        currentCmd = Cmd.ConnectWifi
        sendAT(`AT+CWJAP="${ssid}","${pw}"`) // connect to Wifi router
        control.waitForEvent(EspEventSource, EspEventValue.ConnectWifi)
        while (!wifi_connected) {
            restEsp8266()
            sendAT(`AT+CWJAP="${ssid}","${pw}"`)
            control.waitForEvent(EspEventSource, EspEventValue.ConnectWifi)
        }
    }

    /**
     * Warning: Deprecated.
     * Check if ESP8266 successfully connected to Wifi
     */
    //% block="Wifi connected %State" weight=70
    export function wifiState(state: boolean) {
        return wifi_connected === state
    }
    //%blockId=wifi_ext_board_start_server_WAN
    //%block="Start WiFi remote control (WAN)"
    //% weight=80  group="Start the control"
    //% blockHidden=true
    export function startWebServer_WAN(): void {
        flag = true
        serial.writeLine("(AT+pubnub)")
        Wan_connected = true

    }


    /**
     * Connect to ThingSpeak
     */
    //% block="connect thingspeak"
    //% write_api_key.defl=your_write_api_key
    //% subcategory="ThingSpeak" weight=90
    export function connectThingSpeak() {
        currentCmd = Cmd.ConnectThingSpeak
        // connect to server
        sendAT(`AT+CIPSTART="TCP","${THINGSPEAK_HOST}",${THINGSPEAK_PORT}`)
        control.waitForEvent(EspEventSource, EspEventValue.ConnectThingSpeak)
        pause(100)
    }

    /**
     * Connect to ThingSpeak and set data.
     */
    //% block="set data to send ThingSpeak | Write API key = %write_api_key|Field 1 = %n1||Field 2 = %n2|Field 3 = %n3|Field 4 = %n4|Field 5 = %n5|Field 6 = %n6|Field 7 = %n7|Field 8 = %n8"
    //% write_api_key.defl=your_write_api_key
    //% expandableArgumentMode="enabled"
    //% subcategory="ThingSpeak" weight=85
    export function setData(write_api_key: string, n1: number = 0, n2: number = 0, n3: number = 0, n4: number = 0, n5: number = 0, n6: number = 0, n7: number = 0, n8: number = 0) {
        TStoSendStr = "GET /update?api_key="
            + write_api_key
            + "&field1="
            + n1
            + "&field2="
            + n2
            + "&field3="
            + n3
            + "&field4="
            + n4
            + "&field5="
            + n5
            + "&field6="
            + n6
            + "&field7="
            + n7
            + "&field8="
            + n8
    }

    /**
     * upload data. It would not upload anything if it failed to connect to Wifi or ThingSpeak.
     */
    //% block="Upload data to ThingSpeak"
    //% subcategory="ThingSpeak" weight=80
    export function uploadData() {
        sendAT(`AT+CIPSEND=${TStoSendStr.length + 2}`, 300)
        sendAT(TStoSendStr, 300) // upload data
    }
    /**
         * Use IoT:bit to send the HTTP request, input the URL of your API.
         * The Body content only available for POST method.
         * The POST Body Content-Type was "application/json",
         * DO NOT include "&" symbol in the JSON content.
         * 
         */
    //% subcategory="ThingSpeak" weight=80

    //%blockId=wifi_ext_board_generic_http
    //% block="Send HTTP Request |Method %method|URL:%url|Body:%body"
    //% inlineInputMode=external
    export function sendGenericHttp(method: httpMethod, url: string, body: string): void {
        //httpReturnArray = []
        let temp = ""
        switch (method) {
            case httpMethod.GET:
                temp = "GET"
                break
            case httpMethod.POST:
                temp = "POST"
                break





        }
        serial.writeLine("(AT+http?method=" + temp + "&url=" + url + "&header=" + "&body=" + body + ")");
    }
    /**
     * After sending the HTTP request, the response will be return to this handler, you may access the http
status code and the return body.
     */

    //% subcategory="ThingSpeak" weight=80
    //% blockId="wifi_ext_board_http_receive" 
    //% block="On HTTP received"     
    //% weight=108 draggableParameters=reporter
    //% blockGap=20

    export function on_HTTP_recevid(handler: (HTTP_Status_Code: string, Data: string) => void): void {
        HTTP_received = handler;
    }

    /**
     * This function can extract the value of specific key from a JSON format String.
     * Fill in the Key field that you are searching from json_object, then put the source into the Source placeholder(e.g HTTP return Data).
     * It will search the key from Source string and return the corresponding value.
     * When using at the multi-level JSON, you need to use this function several time to extract the value one by one level.
     * @param target Key that looking for
     * @param source Source string that to be extract from
     */
    //% subcategory="ThingSpeak" weight=80
    //% blockId="JSON_extractor"
    //%block="Get value of Key %target from JSON String %source"
    //% weight=107 
    export function get_value(target: string, source: string): string {

        //clear the keys & values array
        array_keys = []
        array_values = []
        //parse the JSON String to Object
        let json_object = JSON.parse(source)
        //Get the count of keys for the For-Loop to run
        let total_keys = Object.keys(json_object).length
        // Start work on each keys
        for (let i = 0; i < total_keys; i++) {
            //Push each key from JSON Object to keys array
            array_keys.push(Object.keys(json_object)[i])
            // Check the corresponding value of the key from Object, 
            // if it is string or number type, push it to value array as normal
            if ((typeof (json_object[array_keys[array_keys.length - 1]]) == "string") || (typeof (json_object[array_keys[array_keys.length - 1]]) == "number")) {
                //push the string or number value to array
                array_values.push(json_object[array_keys[array_keys.length - 1]])

            }
            // if the value is an Object type, mostly is next level JSON object
            else if (typeof (json_object[array_keys[array_keys.length - 1]]) == "object") {
                //Use stringify to convert it back to string, allow to return the stringify object to user,
                //User can perform JSON parse function again later, while the source can set as this return string
                array_values.push(JSON.stringify(json_object[array_keys[array_keys.length - 1]]))

            }
        }
        //After input all the data, search the target's key index
        let target_index = array_keys.indexOf(target)
        //Return the value of that key
        return array_values[target_index]

    }



    //% subcategory="ThingSpeak" weight=80
    //% blockId="wifi_ext_board_generic_http_array_return" 

    //% block="HTTP response (string array)"
    //% weight=110   
    //% blockGap=7
    //% blockHidden=true
    export function getGenericHttpReturn(): Array<string> {
        return [""];
    }
    //% subcategory="ThingSpeak" weight=80
    //% blockId="wifi_ext_board_generic_http_return" 
    //% block="HTTP response (string)"
    //% weight=110  
    //% blockGap=7
    //% blockHidden=true
    export function getHttpReturn(): string {
        return httpReturnString;

    }



























































    /**
     * Check if ESP8266 successfully connected to ThingSpeak
     */
    //% block="ThingSpeak connected %State"
    //% subcategory="ThingSpeak" weight=65
    export function thingSpeakState(state: boolean) {
        return thingspeak_connected === state
    }

    /*-----------------------------------kidsiot---------------------------------*/
    /**
     * Connect to kidsiot
     */
    //% subcategory=KidsIot weight=50
    //% blockId=initkidiot block="Connect KidsIot with userToken: %userToken Topic: %topic"
    export function connectKidsiot(userToken: string, topic: string): void {
        userToken_def = userToken
        topic_def = topic
        currentCmd = Cmd.ConnectKidsIot
        sendAT(`AT+CIPSTART="TCP","${KIDSIOT_HOST}",${KIDSIOT_PORT}`)
        control.waitForEvent(EspEventSource, EspEventValue.ConnectKidsIot)
        pause(100)
        const jsonText = `{"topic":"${topic}","userToken":"${userToken}","op":"init"}`
        currentCmd = Cmd.InitKidsIot
        sendAT(`AT+CIPSEND=${jsonText.length + 2}`)
        control.waitForEvent(EspEventSource, EspEventValue.InitKidsIot)
        if (kidsiot_connected) {
            sendAT(jsonText)
            control.waitForEvent(EspEventSource, EspEventValue.InitKidsIot)
        }
        pause(1500)
    }

    /**
     * upload data to kidsiot
     */
    //% subcategory=KidsIot weight=45
    //% blockId=uploadkidsiot block="Upload data %data to kidsiot"
    export function uploadKidsiot(data: number): void {
        data = Math.floor(data)
        const jsonText = `{"topic":"${topic_def}","userToken":"${userToken_def}","op":"up","data":"${data}"}`
        currentCmd = Cmd.UploadKidsIot
        sendAT(`AT+CIPSEND=${jsonText.length + 2}`)
        control.waitForEvent(EspEventSource, EspEventValue.UploadKidsIot)
        if (kidsiot_connected) {
            sendAT(jsonText)
            control.waitForEvent(EspEventSource, EspEventValue.UploadKidsIot)
        }
        pause(1500)
    }

    /**
     * disconnect from kidsiot
     */
    //% subcategory=KidsIot weight=40
    //% blockId=Disconnect block="Disconnect with kidsiot"
    export function disconnectKidsiot(): void {
        if (kidsiot_connected) {
            const jsonText = `{"topic":"${topic_def}","userToken":"${userToken_def}","op":"close"}`
            currentCmd = Cmd.DisconnectKidsIot
            sendAT("AT+CIPSEND=" + (jsonText.length + 2))
            control.waitForEvent(EspEventSource, EspEventValue.DisconnectKidsIot)
            if (kidsiot_connected) {
                sendAT(jsonText)
                control.waitForEvent(EspEventSource, EspEventValue.DisconnectKidsIot)
            }
            pause(1500)
        }
    }

    /**
     * Check if ESP8266 successfully connected to KidsIot
     */
    //% block="KidsIot connection %State"
    //% subcategory="KidsIot" weight=35
    export function kidsiotState(state: boolean) {
        return kidsiot_connected === state
    }

    //% block="When switch %vocabulary"
    //% subcategory="KidsIot" weight=30
    //% state.fieldEditor="gridpicker" state.fieldOptions.columns=2
    export function iotSwitchEvent(state: KidsIotSwitchState, handler: () => void) {
        control.onEvent(KidsIotEventSource, state, handler)
    }

    /*----------------------------------MQTT-----------------------*/
    /**
     * Set  MQTT client
     */
    //% subcategory=MQTT weight=30
    //% blockId=initMQTT block="Set MQTT client config|scheme: %scheme clientID: %clientID username: %username password: %password path: %path"
    export function setMQTT(scheme: SchemeList, clientID: string, username: string, password: string, path: string): void {
        sendAT(`AT+MQTTUSERCFG=0,${scheme},"${clientID}","${username}","${password}",0,0,"${path}"`, 1000)
    }

    /**
     * Connect to MQTT broker
     */
    //% subcategory=MQTT weight=25
    //% blockId=connectMQTT block="connect MQTT broker host: %host port: %port reconnect: $reconnect"
    export function connectMQTT(host: string, port: number, reconnect: boolean): void {
        mqtthost_def = host
        const rec = reconnect ? 0 : 1
        currentCmd = Cmd.ConnectMqtt
        sendAT(`AT+MQTTCONN=0,"${host}",${port},${rec}`)
        control.waitForEvent(EspEventSource, EspEventValue.ConnectMqtt)
        Object.keys(mqttSubscribeQos).forEach(topic => {
            const qos = mqttSubscribeQos[topic]
            sendAT(`AT+MQTTSUB=0,"${topic}",${qos}`, 1000)
        })
    }

    /**
     * Check if ESP8266 successfully connected to mqtt broker
     */
    //% block="MQTT broker is connected"
    //% subcategory="MQTT" weight=24
    export function isMqttBrokerConnected() {
        return mqttBrokerConnected
    }

    /**
     * send message
     */
    //% subcategory=MQTT weight=21
    //% blockId=sendMQTT block="publish %msg to Topic:%topic with Qos:%qos"
    //% msg.defl=hello
    //% topic.defl=topic/1
    export function publishMqttMessage(msg: string, topic: string, qos: QosList): void {
        sendAT(`AT+MQTTPUB=0,"${topic}","${msg}",${qos},0`, 1000)
    }

    /**
     * disconnect MQTT broker
     */
    //% subcategory=MQTT weight=15
    //% blockId=breakMQTT block="Disconnect from broker"
    export function breakMQTT(): void {
        sendAT("AT+MQTTCLEAN=0", 1000)
    }

    //% block="when Topic: %topic have new $message with Qos: %qos"
    //% subcategory=MQTT weight=10
    //% draggableParameters
    //% topic.defl=topic/1
    export function MqttEvent(topic: string, qos: QosList, handler: (message: string) => void) {
        mqttSubscribeHandlers[topic] = handler
        mqttSubscribeQos[topic] = qos
    }

    //////////----------------------------------- IFTTT--------------------------------/////////
    /**
     * set ifttt
     */
    //% subcategory=IFTTT weight=9
    //% blockId=setIFTTT block="set IFTTT key:%key event:%event"
    export function setIFTTT(key: string, event: string): void {
        iftttkey_def = key
        iftttevent_def = event
    }

    /**
     * post ifttt
     */
    //% subcategory=IFTTT weight=8
    //% blockId=postIFTTT block="post IFTTT with|value1:%value value2:%value2 value3:%value3"
    export function postIFTTT(value1: string, value2: string, value3: string): void {
        let sendST1 = "AT+HTTPCLIENT=3,1,\"http://maker.ifttt.com/trigger/" + iftttevent_def + "/with/key/" + iftttkey_def + "\",,,2,"
        let sendST2 = "\"{\\\"value1\\\":\\\"" + value1 + "\\\"\\\,\\\"value2\\\":\\\"" + value2 + "\\\"\\\,\\\"value3\\\":\\\"" + value3 + "\\\"}\""
        let sendST = sendST1 + sendST2
        sendAT(sendST, 1000)
        //control.waitForEvent(EspEventSource, EspEventValue.PostIFTTT)
    }

    /**
     * on serial received data
     */
    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        recvString += serial.readString()
        pause(1)

        // received kids iot data
        if (recvString.includes("switchoff")) {
            recvString = ""
            control.raiseEvent(KidsIotEventSource, KidsIotEventValue.switchOff)
        } else if (recvString.includes("switchon")) {
            recvString = ""
            control.raiseEvent(KidsIotEventSource, KidsIotEventValue.switchOn)
        }

        if (recvString.includes("MQTTSUBRECV")) {
            recvString = recvString.slice(recvString.indexOf("MQTTSUBRECV"))
            const recvStringSplit = recvString.split(",", 4)
            const topic = recvStringSplit[1].slice(1, -1)
            const message = recvStringSplit[3].slice(0, -2)
            mqttSubscribeHandlers[topic] && mqttSubscribeHandlers[topic](message)
            recvString = ""
        }

        if (recvString.includes("Congratu")) {
            recvString = ""
            control.raiseEvent(EspEventSource, EspEventValue.PostIFTTT)
        }

        switch (currentCmd) {
            case Cmd.ConnectWifi:
                if (recvString.includes("AT+CWJAP")) {
                    recvString = recvString.slice(recvString.indexOf("AT+CWJAP"))
                    if (recvString.includes("WIFI GOT IP")) {
                        wifi_connected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.ConnectWifi)
                    } else if (recvString.includes("ERROR")) {
                        wifi_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.ConnectWifi)
                    }
                }
                break
            case Cmd.ConnectThingSpeak:
                if (recvString.includes(THINGSPEAK_HOST)) {
                    recvString = recvString.slice(recvString.indexOf(THINGSPEAK_HOST))
                    if (recvString.includes("CONNECT")) {
                        thingspeak_connected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.ConnectThingSpeak)
                    } else if (recvString.includes("ERROR")) {
                        thingspeak_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.ConnectThingSpeak)
                    }
                }
                break
            case Cmd.ConnectKidsIot:
                if (recvString.includes(KIDSIOT_HOST)) {
                    recvString = recvString.slice(recvString.indexOf(KIDSIOT_HOST))
                    if (recvString.includes("CONNECT")) {
                        kidsiot_connected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.ConnectKidsIot)
                    } else if (recvString.includes("ERROR")) {
                        kidsiot_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.ConnectKidsIot)
                    }
                }
                break
            case Cmd.InitKidsIot:
                if (recvString.includes("AT+CIPSEND")) {
                    recvString = recvString.slice(recvString.indexOf("AT+CIPSEND"))
                    if (recvString.includes("OK")) {
                        kidsiot_connected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.InitKidsIot)
                    } else if (recvString.includes("ERROR")) {
                        kidsiot_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.InitKidsIot)
                    }
                } else {
                    if (recvString.includes("SEND OK")) {
                        kidsiot_connected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.InitKidsIot)
                    } else if (recvString.includes("ERROR")) {
                        kidsiot_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.InitKidsIot)
                    }
                }
                break
            case Cmd.UploadKidsIot:
                if (recvString.includes("AT+CIPSEND")) {
                    recvString = recvString.slice(recvString.indexOf("AT+CIPSEND"))
                    if (recvString.includes("OK")) {
                        kidsiot_connected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.UploadKidsIot)
                    } else if (recvString.includes("ERROR")) {
                        kidsiot_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.UploadKidsIot)
                    }
                } else {
                    if (recvString.includes("SEND OK")) {
                        kidsiot_connected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.UploadKidsIot)
                    } else if (recvString.includes("ERROR")) {
                        kidsiot_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.UploadKidsIot)
                    }
                }
                break
            case Cmd.DisconnectKidsIot:
                if (recvString.includes("AT+CIPSEND")) {
                    recvString = recvString.slice(recvString.indexOf("AT+CIPSEND"))
                    if (recvString.includes("OK")) {
                        kidsiot_connected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.DisconnectKidsIot)
                    } else if (recvString.includes("ERROR")) {
                        kidsiot_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.DisconnectKidsIot)
                    }
                } else {
                    if (recvString.includes("SEND OK")) {
                        kidsiot_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.DisconnectKidsIot)
                    } else if (recvString.includes("ERROR")) {
                        kidsiot_connected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.DisconnectKidsIot)
                    }
                }
                break
            case Cmd.ConnectMqtt:
                if (recvString.includes(mqtthost_def)) {
                    recvString = recvString.slice(recvString.indexOf(mqtthost_def))
                    if (recvString.includes("OK")) {
                        mqttBrokerConnected = true
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.ConnectMqtt)
                    } else if (recvString.includes("ERROR")) {
                        mqttBrokerConnected = false
                        recvString = ""
                        control.raiseEvent(EspEventSource, EspEventValue.ConnectMqtt)
                    }
                }
                break
        }
    })
}


