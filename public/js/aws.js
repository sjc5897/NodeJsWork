      cred = {
            twitchUsername: "thecommieapple",
            twitchOAuthToken: "oauth:wf1bmhc6853idvnhk5oijtdrr9ku0e",
            awsAccessKeyId: "AKIAVIWAC2UV6KIIWXZW",
            awsSecretAccessKey: "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"
        };
        AWS.config.region = 'us-east-1';
        ep = new AWS.Endpoint('translate.us-east-1.amazonaws.com');
        AWS.config.credentials = new AWS.Credentials(cred.awsAccessKeyId,
            cred.awsSecretAccessKey);
        window.translator = new AWS.Translate({ endpoint: ep, region: AWS.config.region });
        /**************************Init and Connect to Chat****************************/
        function connect() {
            init();
            //Twitch Client
            var options = {
                options: {
                    debug: false
                },
                connection: {
                    cluster: "aws",
                    reconnect: true
                },
                identity: {
                    username: cred.twitchUsername,
                    password: cred.twitchOAuthToken
                },
                channels: [con.channel]
            };
            window.client = tmi.client(options);
            window.client.connect();
            //Attached Handlers
            window.client.on("chat", onChat);
            window.client.on("connecting", onConnecting);
            window.client.on("connected", onConnected);
            //Disable UI Elements
            document.getElementById("sourceLanguage").disabled = true;
            document.getElementById("targetLanguage").disabled = true;
            document.getElementById("channel").disabled = true;
            document.getElementById("btn-go").disabled = true;
        }
        function init() {
            //Get UI Controls
            var lc = document.getElementById("livechat");
            var lt = document.getElementById("livetranslation")
            var lcc = document.getElementById("livechatc");
            var ltc = document.getElementById("livetranslationc")
            var cbspeak = document.getElementById("cbSpeak")
            var follow = document.getElementById("follow");
            var sendMessage = document.getElementById("message");
            //Cache values
            con = {
                channel: document.getElementById("channel").value,
                sourceLanguage: document.getElementById("sourceLanguage").value,
                targetLanguage: document.getElementById("targetLanguage").value,
                liveChatUI: lc,
                liveTranslationUI: lt,
                liveChatUIContainer: lcc,
                liveTranslationUIContainer: ltc,
                cbSpeak: cbspeak,
                follow: follow,
                sendMessage: sendMessage
            }
            lc.innerHTML = '';
            lt.innerHTML = '';
            //Speaker
            var voiceId = "Joanna";
            if (con.targetLanguage == "en")
                voiceId = "Joanna";
            else if (con.targetLanguage == "de")
                voiceId = "Marlene";
            else if (con.targetLanguage == "es")
                voiceId = "Conchita";
            else if (con.targetLanguage == "fr")
                voiceId = "Celine";
            else if (con.targetLanguage == "pt")
                voiceId = "Ines";
            else
                voiceId = "Joanna";
            window.audioPlayer = AudioPlayer(voiceId);
        }
        /**************************Init and Connect to Chat****************************/
        /**************************Receive and Translate Chat****************************/
        function onChat(channel, userstate, message, self) {
            // Don't listen to my own messages..
            if (self) return;
            //Translate
            if (message) {
                var username = userstate['username'];
                var params = {
                    Text: message,
                    SourceLanguageCode: con.sourceLanguage,
                    TargetLanguageCode: con.targetLanguage
                };

                // In a real application, you need to include input validation and encoding of the text message, to guard against
                // malicious attacks that inject javascript or other html/css tags in an attempt to take over the browser.
                window.translator.translateText(params, function onIncomingMessageTranslate(err,
                    data) {
                    if (err) {
                        console.log("Error calling Translate. " + err.message + err.stack);
                    }
                    if (data) {
                        console.log("M: " + message);
                        console.log("T: " + data.TranslatedText);
                        //Print original message in chat UI
                        con.liveChatUI.innerHTML += '<strong>' + username + '</strong>: ' +
                            message + '<br>';
                        //Print translation in translation UI
                        con.liveTranslationUI.innerHTML += '<strong>' + username + '</strong>: '
                            + data.TranslatedText + '<br>';
                        //If speak translation in enabled, speak translated message
                        if (con.cbSpeak.checked) {
                            if (con.follow.value == "" || username == con.follow.value)
                                audioPlayer.Speak(username + " says " + data.TranslatedText);
                        }
                        //Scroll chat and translated UI to bottom to keep focus on latest
                        messages
                        con.liveChatUIContainer.scrollTop = con.liveChatUIContainer.scrollHeight;
                        con.liveTranslationUIContainer.scrollTop =
                            con.liveTranslationUIContainer.scrollHeight;
                    }
                });
            }
        }
        /**************************Receive and Translate Chat****************************/
        /**************************Client Connecting****************************/
        function onConnecting(address, port) {
            document.getElementById("status").innerHTML = " [ Connecting...]"
        }
        function onConnected(address, port) {
            document.getElementById("status").innerHTML = " [ Connected ]"
            window.audioPlayer.Speak("Connected to channel " + con.channel + ". You should now be getting live chat messages.");
        }
        /**************************Client Connecting****************************/
        /**************************Send Message****************************/
        function sendMessage() {
            if (con.sendMessage.value) {
                message = con.sendMessage.value;
                var params = {
                    Text: con.sendMessage.value,
                    SourceLanguageCode: con.targetLanguage,
                    TargetLanguageCode: con.sourceLanguage
                };
                window.translator.translateText(params, function onSendMessageTranslate(err,
                    data) {
                    if (err) {
                        console.log("Error calling Translate. " + err.message + err.stack);
                    }
                    if (data) {
                        console.log("M: " + message);
                        console.log("T: " + data.TranslatedText);
                        //Send message to chat
                        window.client.action(con.channel, data.TranslatedText);
                        //Clear send message UI
                        con.sendMessage.value = "";
                        //Print original message in Translated UI
                        con.liveTranslationUI.innerHTML += '<strong> ME: </strong>: ' +
                            message + '<br>';
                        //Print translated message in Chat UI
                        con.liveChatUI.innerHTML += '<strong> ME: </strong>: ' +
                            data.TranslatedText + '<br>';
                        //Scroll chat and translated UI to bottom to keep focus on latest
                        messages
                        con.liveChatUIContainer.scrollTop =
                            con.liveChatUIContainer.scrollHeight;
                        con.liveTranslationUIContainer.scrollTop =
                            con.liveTranslationUIContainer.scrollHeight;
                    }
                });
            }
        }
        /**************************Send Message****************************/
        /**************************Audio player****************************/
        function AudioPlayer(voiceId) {
            var audioPlayer = document.createElement('audio');
            audioPlayer.setAttribute("id", "audioPlayer");
            document.body.appendChild(audioPlayer);
            var isSpeaking = false;
            var speaker = {
                self: this,
                playlist: [],
                Speak: function (text) {
                    //If currently speaking a message, add new message to the playlist
                    if (isSpeaking) {
                        this.playlist.push(text);
                    } else {
                        speakTextMessage(text).then(speakNextTextMessage)
                    }
                }
            }
            // Speak text message
            function speakTextMessage(text) {
                return new Promise(function (resolve, reject) {
                    isSpeaking = true;
                    getAudioStream(text).then(playAudioStream).then(resolve);
                });
            }
            // Speak next message in the list
            function speakNextTextMessage() {
                var pl = speaker.playlist;
                if (pl.length > 0) {
                    var txt = pl[0];
                    pl.splice(0, 1);
                    speakTextMessage(txt).then(speakNextTextMessage);
                }
            }
            // Get synthesized speech from Amazon polly
            function getAudioStream(textMessage) {
                return new Promise(function (resolve, reject) {
                    var polly = new AWS.Polly();
                    var params = {
                        OutputFormat: 'mp3',
                        Text: textMessage,
                        VoiceId: voiceId
                    }
                    polly.synthesizeSpeech(params, function (err, data) {
                        if (err)
                            reject(err);
                        else
                            resolve(data.AudioStream);
                    });
                });
            }
            // Play audio stream
            function playAudioStream(audioStream) {
                return new Promise(function (resolve, reject) {
                    var uInt8Array = new Uint8Array(audioStream);
                    var arrayBuffer = uInt8Array.buffer;
                    var blob = new Blob([arrayBuffer]);
                    var url = URL.createObjectURL(blob);
                    audioPlayer.src = url;
                    audioPlayer.addEventListener("ended", function () {
                        isSpeaking = false;
                        resolve();
                    });
                    audioPlayer.play();
                });
            }
            return speaker;
        }
 /**************************Audio player****************************/