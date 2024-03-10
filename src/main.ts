import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import MonitoringSDK from './utils/monitoringSDK';
import './assets/main.css';

const monitoringSDK = new MonitoringSDK('http://localhost:3000/report');
monitoringSDK.init();

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.provide('monitoringSDK', monitoringSDK);
app.mount('#app');
