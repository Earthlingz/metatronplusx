/**
 * Written by Anthony Gabel on ?? January 2005.
 *
 * Contains two objects that can perform socket manipulations.
 *
 * A vuuSocket is an actual socket object that can be used to initialize
 * a connection, send information and retrieve 'commands' from text that
 * it receives.
 *
 * A vuuSocketListener implements nsIStreamListener allowing data to
 * be read from the socket and processed asynchronously.
 *
 * Requires:
 *  formatter.js
 */


/**
 * TODO - move this to a service (otherwise it's not unique? I don't think...)
 * Provides a unique command number for socket communications.
 */
var gVUUSocketData =
{
    // TODO - private when made into a service
    TIMEOUT_IS_ALIVE:       2000,
    timerID:                null,
    deadCount:              0,
    currentAlive:           false,
    confirmedDead:          false,
    socket:                 null,
    initialized:            false,
    supportedCommands:      new Object(),
    supportedDocuments:     new Object(),
    commandList:            new Object(),
    supportsCmdsChecked:    false,
    supportsDocsChecked:    false,
    guidGenerator:          null,

    // TODO - public when made into a service
    isAlive:                false,

    // public
    // safe to call this multiple times

    initialize: function ()
    {
        if (!this.initialized) {
            // don't call this.timeout() directly because we want to give the socket
            // a few seconds to sort itself out first
            this.timerID = setTimeout("gVUUSocketData.timeout()", this.TIMEOUT_IS_ALIVE);
            this.guidGenerator = Components.classes["@mozilla.org/vuu/guid-generator-service;1"].
                getService(Components.interfaces.nsIVUUGUIDGeneratorService);
            this.initialized = true;
        }
    },

    // public
    // safe to call this multiple times
    terminate: function()
    {
        if (this.initialized) {
            this.initialized = false;
            if (this.timerID) clearTimeout(this.timerID);
                this.timerID = null;
            this.isAlive = false;
            this.currentAlive = false;
            if (this.socket != null) vuuSocket.closeSocket(this.socket);
                this.socket = null;
        }

    },

    // private
    onDataAvailable: function (aRequest, aSocketContext, aInputStream, aSourceOffset, aCount)
    {
        // [qryAlive][cmdNo][response]
        this.data += this.inStream.read(aCount);

        var        i = 0;
        var        commands = vuuSocket.getCommands(this.data);
        var        command = null;

        this.data = commands[0];

        for (i = 1; i < commands.length; i++) {
            command = new vuuSocketCommand(commands[i]);

            if (command.cmd == vuuSocketCommand.QUERY_ALIVE) {
                gVUUSocketData.handleQueryAlive(command);
            } else if (command.cmd == vuuSocketCommand.QUERY_CMD) {
                gVUUSocketData.handleQueryCommand(command);
            } else if (command.cmd == vuuSocketCommand.QUERY_DOC) {
                gVUUSocketData.handleQueryDocument(command);
            }
        }
    },

    // private
    // handles the processing of a recieved query alive command
    handleQueryAlive: function(aCommand)
    {
        if (aCommand.response && aCommand.response == "yes") {
            gVUUSocketData.isAlive = true;
            gVUUSocketData.currentAlive = true;
        }
    },

    // private
    // handles the processing of a query command query
    handleQueryCommand: function(aCommand)
    {
        var        cmdType = null;
        var        cmdString = this.commandList["" + aCommand.cmdNo];
        var        command = new vuuSocketCommand(cmdString);

        delete this.commandList["" + aCommand.cmdNo];

        cmdType = command.getParam(1);

        if (aCommand.response) {
            if (aCommand.response == "yes") {
                this.supportedCommands[cmdType] = true;
            } else {
                this.supportedCommands[cmdType] = false;
            }
        }
    },

    // private
    // handles the processing of a query document query
    handleQueryDocument: function(aCommand)
    {
        var        docType = null;
        var        cmdString = this.commandList["" + aCommand.cmdNo];
        var        command = new vuuSocketCommand(cmdString);

        delete this.commandList["" + aCommand.cmdNo];

        docType = command.getParam(1);

        if (aCommand.response) {
            if (aCommand.response == "no") {
                this.supportedDocuments[docType] = false;
            } else {
                this.supportedDocuments[docType] = aCommand.response;
            }
        }
    },

    // private
    timeout: function()
    {
        if (!this.currentAlive) {
            this.socket = new vuuSocket();
            this.socket.init(gVUU.prefs.getIntPref("vuuFormattingPort"), gVUUSocketData.onDataAvailable);
        }

        this.isAlive = this.currentAlive;
        this.currentAlive = false;
        this.socket.send("[" + vuuSocketCommand.QUERY_ALIVE + "][" + gVUUSocketData.getGUID() + "][:]\n");
        this.timerID = setTimeout("gVUUSocketData.timeout()", this.TIMEOUT_IS_ALIVE);

        if (this.isAlive) {
            this.deadCount = 0;
            this.confirmedDead = false;

            if (!this.supportsCmdsChecked) {
                this.checkCmdSupports();
                this.supportsCmdsChecked = true;
            }

            if (!this.supportsDocsChecked) {
                this.checkDocSupports();
                this.supportsDocsChecked = true;
            }
        } else {
            this.supportsCmdsChecked = false;
            this.supportsDocsChecked = false;
            this.deadCount++;
            if (this.deadCount == 1) {
                this.supportedCommands = new Object();
                this.supportedDocuments = new Object();
            }
        }

        if (!this.isAlive && !this.confirmedDead && this.deadCount >= 2) {
            this.confirmedDead = true;

            gVUUReporter.vuuAlert(window, "External Application Not Responding",
                "External application that has been set for integration is not responding.\n"
                + "Common causes for this include:\n\n"
                + " - External application is not currently running\n"
                + " - Port number specified in application integration preferences is incorrect\n\n"
                + "No integrated features will be enabled unless the problem is rectified."
            )
        }
    },

    // private
    checkCmdSupports: function ()
    {
        var        cmdList = [
                                vuuSocketCommand.QUERY_DOC, vuuSocketCommand.PROCESS_DOC,
                                vuuSocketCommand.HAVE_CB, vuuSocketCommand.GET_CB];

        var        cmdNo = null;
        var        cmdString = null;
        var        i = 0;

        for (i = 0; i < cmdList.length; i++) {
            cmdNo = gVUUSocketData.getGUID();
            cmdString = "[" + vuuSocketCommand.QUERY_CMD + "][" + cmdNo + "]"
                        + "[" + cmdList[i] + "]";

            this.commandList["" + cmdNo] = cmdString;
            this.socket.send(cmdString + "[:]\n");
        }
    },

    // private
    checkDocSupports: function ()
    {
        var        docList =
                            [
                            vuuSocketCommand.DOC_THRONE,
                            vuuSocketCommand.DOC_C_MILITARY,
                            vuuSocketCommand.DOC_C_INTERNAL,
                            vuuSocketCommand.DOC_C_SCIENCES,
                            vuuSocketCommand.DOC_C_MYSTICS,
                            vuuSocketCommand.DOC_GROWTH,
                            vuuSocketCommand.DOC_SCIENCE,
                            vuuSocketCommand.DOC_MYSTICS,
                            vuuSocketCommand.DOC_THIEVERY,
                            vuuSocketCommand.DOC_FORUMS,
                            vuuSocketCommand.DOC_RELATIONS,
                            vuuSocketCommand.DOC_KINGDOM,
                            vuuSocketCommand.DOC_PAPER,
                            vuuSocketCommand.DOC_PAPER_LAST
                            ];

        var        cmdNo = null;
        var        cmdString = null;
        var        i = 0;

        for (i = 0; i < docList.length; i++) {
            cmdNo = gVUUSocketData.getGUID();
            cmdString = "[" + vuuSocketCommand.QUERY_DOC + "][" + cmdNo + "]"
                        + "[" + docList[i] + "]";

            this.commandList["" + cmdNo] = cmdString;
            this.socket.send(cmdString + "[:]\n");
        }
    },

    // public
    supportsCommand: function (aCommandType)
    {
        var        supports = this.supportedCommands[aCommandType];

        if (supports != null && supports) {
            return true;
        } else {
            return false;
        }
    },

    // public
    // returns either false or types of support (text, html, text|html)
    supportsDocument: function (aDocType)
    {
        // supports will equal either (false or text or html or text|html
        var        supports = this.supportedDocuments[aDocType];

        if (supports != null && !supports) {
            return false;
        } else {
            return supports;
        }
    },

    // public
    getGUID: function ()
    {
        return this.guidGenerator.getGUID();
    }
}


/**
 * Constructor for a socket command.
 *
 * @param  aCommandString - String - command without the end of command delimeter
 */
function vuuSocketCommand(aCommandString)
{
    this.cmd = null;        // String
    this.cmdNo = null;      // long
    this.response = null;   // String
    this.params = null;     // Array (params[0] == this.response)
    this.malformed = false;
    this.parseCommand(aCommandString);
}

/**
 * Parses a full command to set up the fields of this command object.
 *
 * @param  aCommandString - String - Full command to parse
 */
vuuSocketCommand.prototype.parseCommand = function (aCommandString)
{
    var        split = aCommandString.split(/\]\[/);
    var        i = null;

    if (aCommandString.charAt(0) == '[' && aCommandString.charAt(aCommandString.length - 1) == ']') {

        // remove the first '[' and last ']' from the array of strings
        split[0] = split[0].substring(1);
        split[split.length - 1] =
        split[split.length - 1].substring(0, split[split.length - 1].length - 1);

        // set the cmd
        this.cmd = split[0];

        // set the command number
        if (split.length >= 2 && gVUUFormatter.isStringNumber(split[1])) {
            this.cmdNo = parseInt(split[1]);
        } else {
            this.malformed = true;
        }

        // set the response from server, if there is one
        // (unknown / malformed etc. don't have one)
        if (split.length >= 3) {
            this.response = split[2];
        }

        // set parameters - params[0] will be response
        this.params = new Array(split.length - 2);

        // set the parameters
        for (i = 2; i < split.length; i++) {
            this.params[i - 2] = split[i];
        }
    } else {
        this.malformed = true;
    }

}

/**
 * Returns whether this command is of type <code>aCommandType</code>
 * @param  aCommandType Command type to compare against
 * @return true if this command is of type <code>aCommandType</code>; false otherwise
 */
vuuSocketCommand.prototype.isType = function (aCommandType)
{
    return (this.cmd == aCommandType);
}

/**
 * Returns the given parameter
 * @param  aParamNum Parameter to retrieve (starting at 1)
 * @return Parameter if available; otherwise NULL
 */
vuuSocketCommand.prototype.getParam = function (aParamNum)
{
    if (this.params && this.params.length >= aParamNum) {
        return this.params[aParamNum - 1];
    } else {
        return null;
    }

}

/** End of command delimeter */
vuuSocketCommand.END_COMMAND_DELIMETER = "[:]";

/** Start of command character */
vuuSocketCommand.START_COMMAND_CHAR = "[";

/** End of command character */
vuuSocketCommand.END_COMMAND_CHAR = "]";

/** Terminate command */
vuuSocketCommand.TERMINATE = "cmdTerminate";

/** Server alive command */
vuuSocketCommand.QUERY_ALIVE = "qryAlive";

/** Can server handle command? command */
vuuSocketCommand.QUERY_CMD = "qryCmd";

/** Processing error command */
vuuSocketCommand.ERROR = "cmdError";

/** Unknown command */
vuuSocketCommand.UNKNOWN = "cmdUnknown";

/** Malformed command */
vuuSocketCommand.MALFORMED = "cmdMalformed";

/** Able to handle document query */
vuuSocketCommand.QUERY_DOC = "qryDoc";

/** Process document command */
vuuSocketCommand.PROCESS_DOC = "processDoc";

/** CB for province XYZ available query */
vuuSocketCommand.HAVE_CB = "haveCB";

/** get CB for province XYZ command */
vuuSocketCommand.GET_CB = "getCB";

/** Document types */
vuuSocketCommand.DOC_THRONE = "throne";
vuuSocketCommand.DOC_C_MILITARY = "c_military";
vuuSocketCommand.DOC_C_INTERNAL = "c_internal";
vuuSocketCommand.DOC_C_SCIENCES = "c_sciences";
vuuSocketCommand.DOC_C_MYSTICS = "c_mystics";
vuuSocketCommand.DOC_GROWTH = "growth";
vuuSocketCommand.DOC_SCIENCE = "science";
vuuSocketCommand.DOC_MYSTICS = "mystics";
vuuSocketCommand.DOC_THIEVERY = "thievery";
vuuSocketCommand.DOC_FORUMS = "forums";
vuuSocketCommand.DOC_RELATIONS = "relations";
vuuSocketCommand.DOC_KINGDOM = "kingdom";
vuuSocketCommand.DOC_PAPER = "paper";
vuuSocketCommand.DOC_PAPER_LAST = "paper_last";


/**
 * Represents a socket connection. Must be initialized (init() called)
 * before used to send / receive data.
 */
function vuuSocket()
{
    this.gOutStream = null;
    this.gInStream = null;
    this.gInitialized = null;
}

/**
 * Initializes this socket object by creating a socket on localhost for the
 * given port and registering 'aOnDataAvailable' as the method to call when
 * receiving data from the socket.
 *
 * @param  aPort - integer - Port to create socket connection to.
 * @param  aOnDataAvailable - Function - function to be called when data is
 *         available to be read from the socket. Must accept parameters as per
 *         the nsIStreamListener.onDataAvailable(...) function.
 * @return NULL if successful; String error if unsuccessful
 */
vuuSocket.prototype.init = function(aPort, aOnDataAvailable)
{
    var        transportService = null;
    var        transport = null;
    var        stream = null;
    var        pump = null;

    if (!this.gInitialized) {
        try {
            transportService =
                Components.classes["@mozilla.org/network/socket-transport-service;1"]
                    .getService(Components.interfaces.nsISocketTransportService);

            transport = transportService.createTransport(null, 0, "localhost", aPort, null);
            this.gOutStream = transport.openOutputStream(0, 0, 0);
        }

        catch (e) {
            return "Error: could not create OutStream";
        }

        try {
            stream = transport.openInputStream(0,0,0);
            this.gInStream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                    .createInstance(Components.interfaces.nsIScriptableInputStream);

            this.gInStream.init(stream);

            pump = Components.
                    classes["@mozilla.org/network/input-stream-pump;1"].
                    createInstance(Components.interfaces.nsIInputStreamPump);

            pump.init(stream, -1, -1, 0, 0, false);
            pump.asyncRead(new vuuSocketListener(
                    this.gInStream, this.gOutStream, aOnDataAvailable), null);
        }

        catch (ex) {
            return "Error: Could not create InStream";
        }

        this.gInitialized = true;
        return null;
    }

    return null;
}

/**
 * Sends text through the socket connection.
 *
 * @param  aText - String - text to send through socket connection
 * @return NULL if successful; String error if unsuccessful
 */
vuuSocket.prototype.send = function(aText)
{
    if (this.gInitialized) {
        try {
            this.gOutStream.write(aText, aText.length);
            return null;
        }

        catch (e) {
            return "Socket Send Error: " + e;
        }
    } else {
        return "Error: Socket Not initialized";
    }
}

/**
 * Sends a terminate command through the socket then closes it.
 *
 * @return NULL if successful; String error if unsuccessful
 */
vuuSocket.prototype.close = function()
{
    try {
        if (this.gInStream) {
            this.gInStream.close();
            this.gInStream = null;
        }

        if (this.gOutStream) {
            this.send("[" + vuuSocketCommand.TERMINATE + "][" + gVUUSocketData.getGUID() + "][:]\n");
            this.gOutStream.close();
            this.gOutStream = null;
        }
    }

    catch (e) {
        return "Close Socket Error: " + e;
    }

    return null;
}

/**
 * Static Function of vuuSocket.
 * Parses a String of commands and returns an array of those commands.
 * The first element of the array is any portion of the String that
 * is left over after parsing for commands and the subsequent elements
 * are the parsed list of commands.
 * eg. if text = aaabbb[:]bbbc then the first element of the returned
 * array will be 'bbbc' and the second will be 'aaabbb'
 *
 * @param  aText - String - text to parse into array of commands
 *
 * @return String Array - parsed list of commands with the first element
 *         being any left over portion of the given text after parsing
 *         commands and the subsequent elements being the parsed commands
 */
vuuSocket.getCommands = function(aText)
{
    var        retVal = new Array(1);
    var        index = null;
    var        text = (aText != null) ? aText : "";

    retVal[0] = "!";
    text = text.lTrim();

    while ((index = text.indexOf(vuuSocketCommand.END_COMMAND_DELIMETER)) != -1) {

        retVal.push(text.substring(0, index).rTrim());

        if (index + vuuSocketCommand.END_COMMAND_DELIMETER.length < text.length) {
            text = text.substring(index + vuuSocketCommand.END_COMMAND_DELIMETER.length);
            text = text.lTrim();
        } else {
            text = "";
        }
    }

    retVal[0] = text;

    return retVal;
}

/**
 * Sends a terminate command through the socket then closes it.
 *
 * @param  aSocket - vuuSocket - socket to close
 * @return NULL if successful; String error if unsuccessful
 */
vuuSocket.closeSocket = function(aSocket)
{
    try {
        if (aSocket.gInStream) {
            aSocket.gInStream.close();
            aSocket.gInStream = null;
        }

        if (aSocket.gOutStream) {
            aSocket.send("[" + vuuSocketCommand.TERMINATE + "][" + gVUUSocketData.getGUID() + "][:]\n");
            aSocket.gOutStream.close();
            aSocket.gOutStream = null;
        }
    }

    catch (e) {
        return "Close Socket Error: " + e;
    }

    return null;
}


/**
 * Represents a listener attached to a socket. Implements nsIStreamListener.
 *
 * @param  aInStream - nsIScriptableInputStream - stream from which data is received.
 * @param  aOutStream - nsIOutputStream - stream to which data is sent
 * @param  aOnDataAvailable - Function - function to be called when data is
 *         available to be read from the socket. Must accept parameters as per
 *         the nsIStreamListener.onDataAvailable(...) function.
 */
function vuuSocketListener(aInStream, aOutStream, aOnDataAvailable)
{
    this.inStream = aInStream;
    this.outStream = aOutStream;
    this.data = "";
    this.newOnDataAvailable = aOnDataAvailable;
}

/**
 * Called to signify the beginning of an asynchronous request.
 * An exception thrown from onStartRequest has the side-effect of causing
 * the request to be canceled.
 *
 * @param  aRequest - nsIRequest - request being observed
 * @param  aContext - nsISupports - user defined context
 */
vuuSocketListener.prototype.onStartRequest =
    function (aRequest, aSocketContext)
{
    // no code
}

/**
 * Called to signify the end of an asynchronous request. This call is always preceded
 * by a call to onStartRequest.
 * An exception thrown from onStopRequest is generally ignored.
 *
 * @param  aRequest - nsIRequest - request being observed
 * @param  aSocketContext - nsISupports - user defined context
 * @param  aStatusCode - reason for stopping (NS_OK if completed successfully)
 */
vuuSocketListener.prototype.onStopRequest =
    function (aRequest, aSocketContext, aStatusCode)
{
    if (this.inStream) {
        this.inStream.close();
        this.inStream = null;
    }

    if (this.outStream) {
        this.outStream.close();
        this.outStream = null;
    }
}

/**
 * Called when the next chunk of data (corresponding to the request) may be read
 * without blocking the calling thread. The onDataAvailable implementation must
 * read exactly count bytes of data before returning.
 * An exception thrown from onDataAvailable has the side-effect of causing
 * the request to be canceled.
 *
 * @param  aRequest - nsIRequest - request corresponding to the source of the data
 * @param  aSocketContext - nsISupports - user defined context
 * @param  aInputStream - nsIInputStream - input stream containing the data chunk
 * @param  aSourceOffset - integer - current stream position
 * @param  aCount - integer - number of bytes available in the stream
 */
vuuSocketListener.prototype.onDataAvailable =
    function (aRequest, aSocketContext, aInputStream, aSourceOffset, aCount)
{
    this.newOnDataAvailable(aRequest, aSocketContext, aInputStream, aSourceOffset, aCount);
}

