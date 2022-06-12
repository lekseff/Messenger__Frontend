import './css/style.css';
// import './js/app';
import Messenger from './js/Messenger';

const register = document.querySelector('.register');
const chat = document.querySelector('.chat');

const app = new Messenger(register, chat);

app.init();
