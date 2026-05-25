import init from 'react_native_mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Inicializa a biblioteca com suporte a armazenamento local
init({
size: 10000,
storageBackend: AsyncStorage,
defaultExpires: 1000 * 3600 * 24,
enableCache: true,
sync: {},
});

export default class MQTTService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    connect(config, onMessage, onConnect, onFailure) {
        const { host, port, user, pass, clientId } = config;

        if (!host || !port) {
            console.error("MQTT Error: Host ou Port indefinidos!");
            if (onFailure) onFailure({ errorMessage: "Host ou Port não configurados" });
            return;
        }

        this.client = new global.Paho.MQTT.Client(host, Number(port), clientId);

        this.client.onMessageArrived = (message) => {
            onMessage(message.destinationName, message.payloadString);
        };

        this.client.onConnectionLost = (responseObject) => {
            this.isConnected = false;
            if (responseObject.errorCode !== 0) {
                console.log("Conexão perdida:", responseObject.errorMessage);
            }
        };
        
        const options = {
            userName: user,
            password: pass,
            useSSL: true,
            onSuccess: onConnect,
            onFailure: onFailure,
            timeout: 3,
            keepAliveInterval: 60,
        };

        this.client.connect(options);
    }

    subscribe(topic) {
        this.client.subscribe(topic);
    }
        
        publish(topic, message) {
        const msg = new Paho.MQTT.Message(message);
        msg.destinationName = topic;
        this.client.send(msg);
        }
    } 