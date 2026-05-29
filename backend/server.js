const mqtt = require('mqtt');
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Erro ao conectar no MySQL. Verifique se o XAMPP/Banco está rodando!", err.message);
        process.exit(1);
    }
    console.log("Conectado ao Banco de Dados SQL com sucesso!");
    connection.release();
});

const mqttUrl = `mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;

const mqttOptions = {
    username: process.env.MQTT_USER || undefined,
    password: process.env.MQTT_PASS || undefined,
    clientId: 'Node_Backend_Logger_' + Math.random().toString(16).substr(2, 8),
    keepalive: 60
};

console.log(`Tentando conectar ao Broker MQTT em: ${mqttUrl}...`);
const mqttClient = mqtt.connect(mqttUrl, mqttOptions);

mqttClient.on('connect', () => {
    console.log("Back-end conectado com sucesso ao MQTT Broker!");
    
    const topicos = ['casa/luz', 'casa/temp', 'casa/umid'];
    
    mqttClient.subscribe(topicos, (err) => {
        if (!err) {
            console.log(`Escutando com sucesso os tópicos: ${topicos.join(', ')}`);
        } else {
            console.error("Erro ao assinar os tópicos:", err);
        }
    });
});

mqttClient.on('message', (topic, message) => {
    const payload = message.toString();
    console.log(`Mensagem recebida -> [${topic}]: ${payload}`);

    const query = "INSERT INTO historico_iot (topico, valor) VALUES (?, ?)";
    
    db.query(query, [topic, payload], (err, result) => {
        if (err) {
            console.error(`Erro ao salvar o tópico [${topic}] no banco:`, err.message);
        } else {
            console.log(`Gravado no SQL! ID gerado: ${result.insertId}`);
        }
    });
});

mqttClient.on('error', (err) => {
    console.error("Erro no cliente MQTT:", err.message);
    console.dir(err, { depth: null });
});